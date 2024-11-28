# weibo-img-crypto
Automatically encrypt and decrypt images uploaded to Weibo

## How to use
### Method 1, suitable for temporary use
Enter the following code in the browser address bar, and the image will be automatically encrypted when it is uploaded. Right-click on the image to automatically decrypt it. Note that the "`javascript:`" in front must be entered manually and cannot be copied and pasted, otherwise it will be automatically removed by the browser. After successful execution, click the polar bear ~~ (brother Tian)~~ button in the lower left corner to open the settings interface

```javascript
javascript:fetch('https://raw.githubusercontent.com/xfgryujk/weibo-img-crypto/master/weibo-img-crypto.js').then(res => res.text(), e => alert('Load failed:' + e)).then(res => {let script = document.createElement('script'); script.innerHTML = res; document.body.appendChild(script)})
```

You can also press `Ctrl + Shift + J` to open the console and enter it. You can also add these codes as URLs to your bookmarks/favorites for faster use

### Method 2, suitable for long-term use
First install the [Tampermonkey](http://tampermonkey.net/) browser extension, then [go to Greasy Fork to add the weibo-img-crypto script](https://greasyfork.org/zh-CN/scripts/370359-weibo-img-crypto). This will automatically execute the code in method 1 when you visit Weibo

## Algorithm description
The principle of encryption is to randomly move pixel blocks or RGB data to a new position, so the random seed must be the same during encryption and decryption. The default random seed is `114514`, which can be modified in the settings interface

It is recommended to use the `block random scrambling` algorithm, so that high-frequency noise caused by lossy compression and decryption will not appear. The `RGB random scrambling` algorithm will cause high-frequency noise caused by lossy compression and decryption. As for the inverted color algorithm, it is only used by the author to view the color pictures of some bloggers, not encryption.

## Compatibility
GIF images are not supported at present, but may be supported in the future

It has only been tested on Chrome and Edge browsers, and support for other browsers is not guaranteed ~~ (What is IE? I don’t know)~~

## Effect
After encryption:

![After encryption](https://github.com/xfgryujk/weibo-img-crypto/blob/master/demo/encrypted.jpg)

After decryption:

![After decryption](https://github.com/xfgryujk/weibo-img-crypto/blob/master/demo/decrypted.png)

Original image:

![Original image](https://github.com/xfgryujk/weibo-img-crypto/blob/master/demo/origin.jpg)

## FA♂Q
### Why is it not supported on mobile phones?
At present, there is really no simple method that supports mobile phones. If there is one, please tell me

### Why don’t you rent a server to store pictures?
I will rent it if you pay

### Why not use Fourier transform?
Because the grayscale range of the picture is only 256 numbers, and the value range after Fourier transform is very large and cannot be represented, not to mention the loss after JPEG compression

### Why not use XOR?
The first version used the XOR method, but after JPEG compression and decryption, serious noise appeared, and the outline of the picture after XOR can still be seen, which cannot prevent being reported by traitors

### Why not use AES, RSA and other encryption?
Same as above, I think retaining the original pixel data can minimize data loss, and encryption is random, it is best not to keep the outline of the original picture to avoid being reported by traitors

### What does the default random seed 114514 mean?
The author’s bad taste, Baidu by yourself