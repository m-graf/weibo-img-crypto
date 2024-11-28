<template>
  <div>
    <el-tooltip class="item" content="Encrypt images to save polar bears">
      <a href="#" @click.prevent="openGui" class="gui-button">
        <img src="https://ww1.sinaimg.cn/mw690/be15a4ddjw8fbet7h4rpoj209z0c7q39.jpg" width="40" height="49">
      </a>
    </el-tooltip>

    <el-dialog title="weibo-img-crypto v1.4.0" :visible.sync="dialogVisible">
      <el-tabs>
        <el-tab-pane label="Basic">
          <el-form label-width="100px">
            <el-form-item label="Encryption">
              <el-switch v-model="form.enableEncryption"></el-switch>
            </el-form-item>
            <el-form-item label="Decryption">
              <el-switch v-model="form.enableDecryption"></el-switch>
            </el-form-item>
            <el-form-item label="Auto Remove Watermark">
              <el-switch v-model="form.noWaterMark"></el-switch>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="Advanced">
          <el-form label-width="100px">
            <el-form-item label="Algorithm">
              <el-select v-model="form.codecName" placeholder="None">
                <el-option label="Invert Colors" value="InvertCodec"></el-option>
                <el-option label="Shuffle RGB" value="ShuffleRgbCodec"></el-option>
                <el-option label="Shuffle Blocks" value="ShuffleBlockCodec"></el-option>
                <el-option label="Partial Invert" value="HalfInvertCodec"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="Random Seed">
              <el-input v-model="form.randomSeed"></el-input>
            </el-form-item>
            <el-form-item label="Post Decrypt Processing">
              <el-select v-model="form.postProcess" placeholder="None">
                <el-option label="None" value=""></el-option>
                <el-option label="Gaussian Blur (removes high-frequency noise)" value="gaussianBlur"></el-option>
                <el-option label="Median Filter (removes salt-and-pepper noise)" value="medianBlur"></el-option>
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="Select Image">
          <select-img></select-img>
        </el-tab-pane>

        <el-tab-pane label="Help and About">
          <div class="child-mb">
            <p>
              Instructions: Encryption is applied automatically when uploading images. Right-click on the image to decrypt automatically. Ensure the same algorithm and random seed are used for encryption and decryption. If a watermark is added, the decrypted image may have artifacts. Enable auto-remove watermark to avoid this. Post-decrypt processing is generally unnecessary unless noise artifacts are severe.
            </p>
            <p>
              Algorithm Recommendations: "Shuffle Blocks" is ideal as it avoids high-frequency noise caused by lossy compression. "Shuffle RGB" may result in such noise. "Invert Colors" is mainly for specific visual effects and isn't suitable for robust encryption.
            </p>
            <p>
              Recommended Tools: Use the <a href="https://greasyfork.org/zh-CN/scripts/370359-weibo-img-crypto" target="_blank">Tampermonkey Script</a> for seamless functionality. For details, see the <a href="https://github.com/xfgryujk/weibo-img-crypto" target="_blank">GitHub repository</a>.
            </p>
            <p>
              Author: xfgryujk. Follow them on Weibo: <a href="https://weibo.com/p/1005055023841292" target="_blank">@B1llyHerrington</a>. Project is open-sourced under the MIT license. View the <a href="https://github.com/xfgryujk/weibo-img-crypto" target="_blank">GitHub source code</a>.
            </p>
          </div>
        </el-tab-pane>
      </el-tabs>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="onOk">Confirm</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getConfig, setConfig } from '../config';
import SelectImg from './select-img';

export default {
  components: {
    SelectImg,
  },
  data() {
    return {
      dialogVisible: false,
      form: getConfig(),
    };
  },
  methods: {
    openGui() {
      this.dialogVisible = true;
      this.form = getConfig();
    },
    onOk() {
      this.dialogVisible = false;
      setConfig(this.form);
    },
  },
};
</script>

<style scoped>
.gui-button {
  position: fixed;
  left: 0;
  bottom: 0;
}

.child-mb * {
  margin-bottom: 1em;
}
</style>
