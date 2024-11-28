<template>
  <div>
    <p class="mb">This feature allows you to select images for encryption and decryption outside of Weibo</p>
    <el-form label-width="100px">
      <el-form-item label="Action">
        <el-switch v-model="isEncryption" active-text="Encrypt" inactive-text="Decrypt"></el-switch>
      </el-form-item>
      <el-form-item label="Paste Image">
        <el-input @paste.native.prevent="onPaste" placeholder="You can also paste images here"></el-input>
      </el-form-item>
      <el-form-item label="Select Image">
        <el-upload action="" drag multiple list-type="picture" :file-list="fileList" :before-upload="onUpload" :on-remove="onRemove" :on-preview="onPreview">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">Drag files here, or <em>click to select</em></div>
        </el-upload>
      </el-form-item>
    </el-form>

    <el-dialog :title="largeImgTitle" :visible.sync="largeImgVisible" append-to-body>
      <a href="#" @click.prevent="onClickLargeImg">
        <img class="image" :src="largeImgUrl">
      </a>
    </el-dialog>
  </div>
</template>

<script>
import { encrypt, decrypt } from '../codec'

export default {
  data() {
    return {
      isEncryption: true, // Default action: Encrypt
      fileList: [],
      largeImgTitle: '',
      largeImgVisible: false,
      largeImgUrl: '',
      largeImgUrlShort: ''
    }
  },
  methods: {
    // Handles paste event for images
    onPaste(event) {
      for (let item of event.clipboardData.items) {
        let file = item.getAsFile();
        if (file) {
          this.handleFile(file);
        }
      }
    },
    // Handles file upload event
    onUpload(file) {
      this.handleFile(file);
      return false; // Prevent auto upload
    },
    // Process file for encryption/decryption
    handleFile(file) {
      if (!file.type.startsWith('image') || file.type === 'image/gif') { // Skip GIFs for now
        return;
      }
      let reader = new FileReader();
      reader.onload = () => {
        let img = new Image();
        img.onload = () => {
          if (this.isEncryption) {
            this.fileList.push({ name: file.name, url: encrypt(img) });
          } else {
            decrypt(img).then(url => this.fileList.push({ name: file.name, url: url }));
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    },
    // Handles file removal from the list
    onRemove(file, fileList) {
      this.fileList = fileList;
    },
    // Previews the image in a dialog
    onPreview(file) {
      this.largeImgTitle = file.name;
      this.largeImgUrl = file.url;
      window.URL.revokeObjectURL(this.largeImgUrlShort);
      this.largeImgUrlShort = '';
      this.largeImgVisible = true;
    },
    // Handles click on the large image preview
    onClickLargeImg() {
      let url;
      if (this.largeImgUrlShort) {
        url = this.largeImgUrlShort;
      } else if (this.largeImgUrl.startsWith('data:')) {
        // Workaround for Chrome/Edge not opening data URLs directly
        let [memePart, base64Str] = this.largeImgUrl.split(',');
        let meme = /:(.*?);/.exec(memePart)[1];
        let dataStr = atob(base64Str);
        let data = new Uint8Array(dataStr.length);
        for (let i = 0; i < dataStr.length; i++) {
          data[i] = dataStr.charCodeAt(i);
        }
        url = this.largeImgUrlShort = window.URL.createObjectURL(new Blob([data], { type: meme }));
      } else {
        url = this.largeImgUrlShort = this.largeImgUrl;
      }
      window.open(url); // Edge still doesn't allow opening blob URLs directly, workaround
    }
  }
}
</script>

<style scoped>
.mb {
  margin-bottom: 1em;
}

.image {
  width: 100%;
}
</style>
