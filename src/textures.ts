import { Material } from '@/engine/renderer/material';
import { textureLoader } from '@/engine/renderer/texture-loader';
import { toImage, toImageData} from '@/engine/svg-maker/svg-string-converters';
import {audioContext} from "@/engine/audio/audio-helpers";

const skyboxSize = 1024;

export const materials: {[key: string]: Material} = {};
export const heightmap: { data: number[] } = { data: [] };

const isChrome = () => !window.navigator.userAgent.includes('refox');
// ultra hack firefox detection. If there's room, do this in a less insane way, like checking user agent for firefox
const filterTag = (id: string) => `<filter id="${id}" ${isChrome() ? 'width="100%" height="100%" x="0" y="0"' : 'width="514px" height="514px" x="-1" y="-1"'} >`

export async function initTextures() {
  materials.bars = new Material({ texture: textureLoader.load_(await bars())});
  materials.iron = new Material({ texture: textureLoader.load_(await metals()) });
  materials.cartoonGrass = new Material({ texture: textureLoader.load_(await diffuseNoise('#008115', '.005', 8, -2, 1, 0, 40))});
  materials.cartoonRockWall = new Material({ texture: textureLoader.load_(await diffuseNoise('rgb(61 80 73 / 0.4)', '.005', 7, 4, 6, 170, 4))});
  materials.shrubs = new Material({ texture: textureLoader.load_(await diffuseNoise('#0d4b22', '.1', 8, -2, 1, 0, 40))});

  materials.brickWall = new Material({ texture: textureLoader.load_(await diffuseNoise('#911fa5', '.02', 8, 7, 1, 115, 60))})
  materials.wood = new Material({ texture: textureLoader.load_(await diffuseNoise('#7B3F00', '0.09,.01', 4, 1, 6, 170, 6))});

  // Horse stuff
  materials.rainbow = new Material({ texture: textureLoader.load_(await rainbow1() )});
  materials.horseEye = new Material({ texture: textureLoader.load_(await horseEye() )});
  materials.nothing = new Material({ texture: textureLoader.load_(await nothing())});
  materials.hooves = new Material({ texture: textureLoader.load_(await solidColor('#333'))});
  materials.horseFace = new Material({ texture: textureLoader.load_(await horseface() )});
  materials.horseNose = new Material({ texture: textureLoader.load_(await horseNose() )});
  materials.white = new Material({ texture: textureLoader.load_(await solidColor('#fff'))});

  materials.witchSkin = new Material({ texture: textureLoader.load_(await solidColor('#56b41b'))});
  materials.witchClothes = new Material({ texture: textureLoader.load_(await solidColor('#902EBB'))});
  materials.pumpkin = new Material({ texture: textureLoader.load_(await solidColor('#f71'))});

  // NOTE: In the depth fragment shader the texture depth is checked to determine shadows, so that these don't cast shadows.
  materials.witchHat = new Material({ texture: textureLoader.load_(await solidColor('#902EBB'))});
  materials.sparkle = new Material({ texture: textureLoader.load_(await emojiParticle('✨', 'filter: hue-rotate(160deg)'))});
  materials.heart = new Material({ texture: textureLoader.load_(await emojiParticle('❤️'))});
  materials.bubbles = new Material({ texture: textureLoader.load_(await emojiParticle('🫧'))});

  // NOTE: In the fragment shader, texture depth is checked to determine lighting, such that the below textures are emissive.

  textureLoader.loadSkybox(await fakeTempSkybox('#781227'));
  textureLoader.loadSkybox(await fakeTempSkybox('#c86619'));
  textureLoader.loadSkybox(await fakeTempSkybox('#d6d44a'));
  textureLoader.loadSkybox(await fakeTempSkybox('#34b167'));
  textureLoader.loadSkybox(await fakeTempSkybox('#41bdb7'));
  textureLoader.loadSkybox(await fakeTempSkybox('#252fe3'));
  textureLoader.loadSkybox(await fakeTempSkybox('#5a0aa5'));

  textureLoader.bindTextures();
}

function horseface() {
  return toImage(`<rect x="0" y="0" width="100%" height="100%" fill="#fff"/>
       <rect x="0" y="410" width="100%" height="102" fill="pink" />`);

}

function horseNose() {
  return toImage(`<ellipse cx="180" cy="128" rx="32" ry="64" fill="#6a2f5f" transform="rotate(-12 180 128)"/>
<ellipse cx="332" cy="128" rx="32" ry="64" fill="#6a2f5f" transform="rotate(12 332 128)"/><path d="M106 336Q256 450 406 336" fill="none" stroke="#6a2f5f" stroke-width="24" stroke-linecap="round"/>`)
}

function emojiParticle(emoji: string, style = '') {
  return toImage(`<text x="50%" y="50%" font-size="400" text-anchor="middle" dominant-baseline="middle" style="${style}">${emoji}</text>`)
}

function bars() {
  return toImage(`<rect width="50%" height="100%" x="25%" fill="#009"/>`);
}

export function metals() {
  return toImage(`${filterTag('b')}<feTurbulence baseFrequency="0.01,0.0008" numOctaves="2" seed="23" type="fractalNoise" stitchTiles="stitch" /><feColorMatrix values="0.01 0.01 0.01 0 0 0.01 0.01 0.01 0 0 0.01 0.01 0.01 0 0 1 1 1 1 1"/></filter><rect x="0" y="0" width="100%" height="100%" filter="url(#b)"/>`);
}

function solidColor(color: string | number, size = 512) {
  return toImage(`<rect x="0" y="0" width="100%" height="100%" fill="${color}"/>`, size);
}

function fakeTempSkybox(color: string) {
  return toImage(`<rect x="0" y="0" width="100%" height="100%" fill="${color}"/>`, skyboxSize * 4, skyboxSize);
}

function drawSkyboxHor(color: string) {
  const element = `<filter id="g" width="100%" height="100%" x="0" y="0">
  <feTurbulence type="fractalNoise" baseFrequency=".002 .01" numOctaves="5" stitchTiles="stitch" seed="25"/>
  <feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 -0.45 0.2"/>
  <feBlend in2="SourceGraphic"/>
</filter>
<rect width="100%" height="100%" y="0" fill="${color}" filter="url(#g)"/>
<filter id="f">
  <feTurbulence baseFrequency="0.008,0" numOctaves="2" seed="15" stitchTiles="stitch" type="fractalNoise" />
  <feDisplacementMap in="SourceGraphic" scale="-100"/>
</filter>
<g>
  <rect filter="url(#f)" height="45%" width="104%" y="-30" x="-2%" fill="#163b28"/>
</g>`;
  return toImage(element, skyboxSize * 4, skyboxSize);
}

function diffuseNoise(color: string, baseFrequency: string, numOctaves: number, surfaceScale: number, diffuseConstant: number, azimuth: number, elevation: number) {
  return toImage(`${filterTag('f')}<feTurbulence type="fractalNoise" baseFrequency="${baseFrequency}" numOctaves="${numOctaves}" stitchTiles="stitch"/><feDiffuseLighting color-interpolation-filters="sRGB" lighting-color="${color}" surfaceScale="${surfaceScale}" diffuseConstant="${diffuseConstant}"><feDistantLight azimuth="${azimuth}" elevation="${elevation}"/></feDiffuseLighting></filter><rect width="100%" height="100%" filter="url(#f)" />`);
}

function horseEye() {
  return toImage(`<svg viewBox="0 0 64 64" width="512" height="512" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="32" rx="26" ry="24" fill="#5b3824"/><ellipse cx="32" cy="32" rx="20" ry="20" fill="#2d1b14"/><ellipse cx="32" cy="32" rx="10" ry="18" fill="#080605"/><ellipse cx="20" cy="21" rx="7" ry="6" fill="#fff"/><circle cx="38" cy="39" r="3" fill="#fff" opacity=".75"/></svg>`)
}

function rainbow1() {
  return toImage(`<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <linearGradient id="r" gradientTransform="rotate(90)">
      <stop stop-color="#7F00FF"/>
      <stop offset=".2" stop-color="blue"/>
      <stop offset=".4" stop-color="green"/>
      <stop offset=".6" stop-color="#ff0"/>
      <stop offset=".8" stop-color="orange"/>
      <stop offset="1" stop-color="red"/>
    </linearGradient>
    <rect width="100%" height="100%" fill="url(#r)"/>
</svg>`);
}

function nothing() {
  return toImage('<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"></svg>');
}

