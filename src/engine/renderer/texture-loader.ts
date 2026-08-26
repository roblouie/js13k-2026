import { gl } from '@/engine/renderer/lil-gl';
import { Texture } from '@/engine/renderer/texture';

class TextureLoader {
  textures: Texture[] = [];
  skyboxes: Texture[] = [];

  fromSkybox = 0;
  toSkybox = 0;
  toBlend = 0;

  load_(textureSource: TexImageSource): Texture {
    const texture = new Texture(this.textures.length, textureSource);
    this.textures.push(texture);
    return texture;
  }

  loadSkybox(textureSource: TexImageSource): void {
    this.skyboxes.push(new Texture(this.textures.length, textureSource));
  }

  bindTextures() {
    this.bindTextures2(gl.TEXTURE0, this.textures, 512, 512);
    this.bindTextures2(gl.TEXTURE2, this.skyboxes, 4096, 2048);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  bindTextures2(textureNum: number, textures: Texture[], width: number, height: number) {
    gl.activeTexture(textureNum);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, gl.createTexture());
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 8, gl.RGBA8, width, height, textures.length);

    textures.forEach((texture, index) => {
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, index, width, height, 1, gl.RGBA, gl.UNSIGNED_BYTE, texture.source);
    });
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
  }
}

export const textureLoader = new TextureLoader();
