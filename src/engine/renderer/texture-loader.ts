import { gl } from '@/engine/renderer/lil-gl';
import { Texture } from '@/engine/renderer/texture';

class TextureLoader {
  textures: Texture[] = [];
  skyboxes: Texture[] = [];

  fromSkybox = 0;
  toSkybox = 0;
  toBlend = 0;

  load_(textureSource: TexImageSource): void {
    this.textures.push(new Texture(this.textures.length, textureSource));
  }

  loadSkybox(textureSource: TexImageSource): void {
    this.skyboxes.push(new Texture(this.textures.length, textureSource));
  }

  bindTextures() {
    this.bindTextures2(33984, this.textures, 512, 512);
    this.bindTextures2(33986, this.skyboxes, 4096, 2048);
    gl.texParameteri(35866, 10241, 9729);
    // gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  bindTextures2(textureNum: number, textures: Texture[], width: number, height: number) {
    gl.activeTexture(textureNum);
    gl.bindTexture(35866, gl.createTexture());
    gl.texStorage3D(35866, 8, 32856, width, height, textures.length);

    textures.forEach((texture, index) => {
      gl.texSubImage3D(35866, 0, 0, 0, index, width, height, 1, 6408, 5121, texture.source);
    });
    gl.generateMipmap(35866);
  }
}

export const textureLoader = new TextureLoader();
