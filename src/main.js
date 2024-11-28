import Vue from 'vue';
import ElementUI from 'element-ui';
import { initHooks } from './hooks';
import { initGui } from './gui';

function main() {
    Vue.use(ElementUI);

    // Lazy way to include CSS (actually, because webpack compilation kept failing)
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/element-ui/lib/theme-chalk/index.css';
    document.body.appendChild(css);

    initHooks();
    initGui();
}

if (window.isWbImgCryptoLoaded) {
    window.alert('weibo-img-crypto is already loaded. Please do not load it again.');
} else {
    window.isWbImgCryptoLoaded = true;
    main();
}
