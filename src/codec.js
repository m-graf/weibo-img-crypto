import { Notification } from 'element-ui';
import { RandomSequence } from './random';
import { getConfig } from './config';
import { gaussianBlur, medianBlur } from './imgproc';

let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d');

// Encrypt the image, return as a data URL
export function encrypt(img) {
    return doCodecCommon(img, (imgData) =>
        Codec.createCodec(getConfig().codecName, imgData).encrypt()
    );
}

// Decrypt the image, return as a data URL
export async function decrypt(originImg) {
    let img;
    try {
        img = await loadImage(getImgSrcToDecrypt(originImg), true);
    } catch (e) {
        Notification.error({
            title: 'Decrypt Image',
            message: 'Failed to load the image, possibly a cross-origin issue?',
            position: 'bottom-left',
            duration: 3000
        });
        return '';
    }
    return doCodecCommon(img, (imgData) => {
        imgData = Codec.createCodec(getConfig().codecName, imgData).decrypt();
        postProcess(imgData);
        return imgData;
    });
}

// Shared encryption and decryption logic, returns processed data URL.
// handleImgData processes imgData and returns new imgData
function doCodecCommon(img, handleImgData) {
    [canvas.width, canvas.height] = [img.width, img.height];
    // Weibo may blend transparent images with white
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, img.width, img.height);
    ctx.drawImage(img, 0, 0);
    let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    imgData = handleImgData(imgData);
    [canvas.width, canvas.height] = [imgData.width, imgData.height];
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL();
}

// Post-process decrypted images, such as filtering
function postProcess(imgData) {
    switch (getConfig().postProcess) {
        case 'gaussianBlur':
            gaussianBlur(imgData);
            break;
        case 'medianBlur':
            medianBlur(imgData);
            break;
    }
}

// Get the original image URL to prevent decryption failure due to Weibo resizing images
function getImgSrcToDecrypt(originImg) {
    const IMG_URL_REG = /^(https?:\/\/wx\d+\.sinaimg\.cn\/)mw\d+(\/.*)$/i;
    let match = IMG_URL_REG.exec(originImg.src);
    let src = match ? `${match[1]}large${match[2]}` : originImg.src;
    if (!originImg.src.startsWith('data:')) {
        // Prevent caching and enable cross-origin
        src += (originImg.src.indexOf('?') === -1 ? '?_t=' : '&_t=') + new Date().getTime();
    }
    return src;
}

// Load an image from a source URL
async function loadImage(src, isCrossOrigin = false) {
    let img = new window.Image();
    if (isCrossOrigin) {
        img.crossOrigin = 'anonymous';
    }
    return new Promise((resolve, reject) => {
        img.onerror = () => reject(new Error('Failed to load image'));
        img.onload = () => resolve(img);
        img.src = src;
    });
}

class Codec {
    constructor(imgData) {
        this._imgData = imgData;
    }

    // Encrypt, return encrypted imgData
    encrypt() {}

    // Decrypt, return decrypted imgData
    decrypt() {}
}

Codec._codecClasses = {};
Codec.createCodec = function (name, imgData) {
    let CodecClass =
        name in Codec._codecClasses
            ? Codec._codecClasses[name]
            : Codec._codecClasses.Move8x8BlockCodec;
    return new CodecClass(imgData);
};

// Invert colors
class InvertCodec extends Codec {
    encrypt() {
        return this._invertColor();
    }
    decrypt() {
        return this._invertColor();
    }
    _invertColor() {
        let data = this._imgData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = ~data[i] & 0xff;
            data[i + 1] = ~data[i + 1] & 0xff;
            data[i + 2] = ~data[i + 2] & 0xff;
        }
        return this._imgData;
    }
}
Codec._codecClasses.InvertCodec = InvertCodec;

// Randomize RGB
class ShuffleRgbCodec extends Codec {
    encrypt() {
        let data = this._imgData.data;
        let nRgbs = (data.length / 4) * 3;
        let seq = new RandomSequence(nRgbs, getConfig().randomSeed);
        let buffer = new Uint8ClampedArray(nRgbs);

        // Place each RGB value in a new position
        for (let i = 0; i < data.length; i += 4) {
            buffer[seq.next()] = data[i];
            buffer[seq.next()] = data[i + 1];
            buffer[seq.next()] = data[i + 2];
        }
        for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
            data[i] = buffer[j];
            data[i + 1] = buffer[j + 1];
            data[i + 2] = buffer[j + 2];
        }
        return this._imgData;
    }

    decrypt() {
        let data = this._imgData.data;
        let nRgbs = (data.length / 4) * 3;
        let buffer = new Uint8ClampedArray(nRgbs);

        for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
            buffer[j] = data[i];
            buffer[j + 1] = data[i + 1];
            buffer[j + 2] = data[i + 2];
        }
        let seq = new RandomSequence(nRgbs, getConfig().randomSeed);

        // Restore original positions
        for (let i = 0; i < data.length; i += 4) {
            data[i] = buffer[seq.next()];
            data[i + 1] = buffer[seq.next()];
            data[i + 2] = buffer[seq.next()];
        }
        return this._imgData;
    }
}
Codec._codecClasses.ShuffleRgbCodec = ShuffleRgbCodec;

// Randomize blocks
// Since JPEG compresses in 8x8 blocks, processing blocks this way avoids noise caused by compression/decompression
class ShuffleBlockCodec extends Codec {
    encrypt() {
        return this._doCommon((result, blockX, blockY, newBlockX, newBlockY) =>
            this._copyBlock(result, newBlockX, newBlockY, this._imgData, blockX, blockY)
        );
    }

    decrypt() {
        return this._doCommon((result, blockX, blockY, newBlockX, newBlockY) =>
            this._copyBlock(result, blockX, blockY, this._imgData, newBlockX, newBlockY)
        );
    }

    _doCommon(handleCopy) {
        // Remove edges if dimensions aren't multiples of 8
        let blockWidth = Math.floor(this._imgData.width / 8);
        let blockHeight = Math.floor(this._imgData.height / 8);
        let result = ctx.createImageData(blockWidth * 8, blockHeight * 8);
        let seq = new RandomSequence(blockWidth * blockHeight, getConfig().randomSeed);

        for (let blockY = 0; blockY < blockHeight; blockY++) {
            for (let blockX = 0; blockX < blockWidth; blockX++) {
                let index = seq.next();
                let newBlockX = index % blockWidth;
                let newBlockY = Math.floor(index / blockWidth);
                handleCopy(result, blockX, blockY, newBlockX, newBlockY);
            }
        }
        return result;
    }

    _copyBlock(dstImgData, dstBlockX, dstBlockY, srcImgData, srcBlockX, srcBlockY) {
        let iDstStart = (dstBlockY * dstImgData.width + dstBlockX) * 8 * 4;
        let iSrcStart = (srcBlockY * srcImgData.width + srcBlockX) * 8 * 4;

        for (let y = 0; y < 8; y++) {
            for (let i = 0; i < 8 * 4; i++) {
                dstImgData.data[iDstStart + i] = srcImgData.data[iSrcStart + i];
            }
            iDstStart += dstImgData.width * 4;
            iSrcStart += srcImgData.width * 4;
        }
    }
}
Codec._codecClasses.ShuffleBlockCodec = ShuffleBlockCodec;

// Half invert colors
class HalfInvertCodec extends Codec {
    encrypt() {
        return this._halfInvertColor();
    }
    decrypt() {
        return this._halfInvertColor();
    }

    _halfInvertColor() {
        let invertFirst = true;
        for (let y = 0; y < this._imgData.height; y += 8) {
            let height = Math.min(8, this._imgData.height - y);
            for (let x = 0; x < this._imgData.width; x += 8) {
                let width = Math.min(8, this._imgData.width - x);
                if (invertFirst) {
                    this._invertColor(x, y, width, height);
                }
                invertFirst = !invertFirst;
            }
        }
        return this._imgData;
    }

    _invertColor(x, y, width, height) {
        let startX = Math.max(0, x);
        let startY = Math.max(0, y);
        let endX = Math.min(this._imgData.width, x + width);
        let endY = Math.min(this._imgData.height, y + height);

        for (let j = startY; j < endY; j++) {
            for (let i = startX; i < endX; i++) {
                let idx = (j * this._imgData.width + i) * 4;
                this._imgData.data[idx] = ~this._imgData.data[idx] & 0xff;
                this._imgData.data[idx + 1] = ~this._imgData.data[idx + 1] & 0xff;
                this._imgData.data[idx + 2] = ~this._imgData.data[idx + 2] & 0xff;
            }
        }
    }
}
Codec._codecClasses.HalfInvertCodec = HalfInvertCodec;
