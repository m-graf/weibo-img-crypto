import { Notification } from 'element-ui';
import { encrypt, decrypt } from './codec';
import { getConfig } from './config';

export function initHooks() {
    hookUpload();
    hookContextMenu();
}

// Hook upload image related functions
async function hookUpload() {
    let isUploadingGif = false;

    // Hook the function that reads image files to determine MIME type
    let originalReadAsDataURL = window.FileReader.prototype.readAsDataURL;
    window.FileReader.prototype.readAsDataURL = function (file) {
        isUploadingGif = file.type === 'image/gif';
        originalReadAsDataURL.call(this, file);
    };

    // Wait for Weibo modules to initialize
    let originalIjax;
    let retryCount = 0;
    while (true) {
        try {
            originalIjax = window.STK.namespace.v6home.core.io.ijax;
            break;
        } catch (e) {
            if (retryCount++ > 10) {
                Notification.error({
                    title: 'Initialization',
                    message: 'Failed to hook upload function. Is this the Weibo homepage? ' + e,
                    position: 'bottom-left'
                });
                return;
            }
            await sleep(500);
        }
    }

    // Hook Weibo HTTP request function to encrypt and remove watermarks
    window.STK.namespace.v6home.core.io.ijax = function (args) {
        if (
            !getConfig().enableEncryption ||
            !args.url.endsWith('/pic_upload.php') ||
            isUploadingGif // GIFs are not supported yet
        ) {
            return originalIjax(args);
        }

        // Handle to cancel requests
        let handle = {
            isAborted: false,
            abort() {
                this.isAborted = true;
            }
        };

        let imgDataInput = args.form.querySelector('input');
        let img = new window.Image();
        img.onload = () => {
            if (handle.isAborted) {
                return;
            }

            // Remove watermark
            if (getConfig().noWaterMark) {
                args.args.url = 0;
                args.args.markpos = '';
                args.args.logo = '';
                args.args.nick = 0;
            }

            // Encrypt and replace the image
            imgDataInput.value = encrypt(img).split(',')[1];
            handle.abort = originalIjax(args).abort;
        };
        img.src = 'data:image;base64,' + imgDataInput.value;
        return handle;
    };
}

// Sleep function for asynchronous waits
async function sleep(time) {
    return new Promise((resolve) => {
        window.setTimeout(resolve, time);
    });
}

// Hook right-click context menu
function hookContextMenu() {
    document.addEventListener('contextmenu', (event) => {
        let originImg = event.target;
        if (
            getConfig().enableDecryption &&
            originImg instanceof window.Image
        ) {
            if (originImg.src.startsWith('data:')) {
                // Already decrypted if the source starts with 'data:'
                return;
            }
            event.preventDefault(); // Block right-click menu during decryption
            decrypt(originImg).then((url) => {
                if (url) {
                    originImg.src = url;
                }
            });
        }
    });
}
