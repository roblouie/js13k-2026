import { Material } from '@/engine/renderer/material';
import { textureLoader } from '@/engine/renderer/texture-loader';
import {toImage} from '@/engine/svg-maker/svg-string-converters';
import {audioContext} from "@/engine/audio/audio-helpers";

const skyboxSize = 1024;

export const materials: {[key: string]: Material} = {};
export const heightmap = { data: [] };

const isChrome = () => !window.navigator.userAgent.includes('refox');
// ultra hack firefox detection. If there's room, do this in a less insane way, like checking user agent for firefox
const filterTag = (id: string) => `<filter id="${id}" ${isChrome() ? 'width="100%" height="100%" x="0" y="0"' : 'width="514px" height="514px" x="-1" y="-1"'} >`

export async function initTextures() {
  materials.bars = new Material({ texture: textureLoader.load_(await bars())});
  materials.iron = new Material({ texture: textureLoader.load_(await metals()) });
  materials.cartoonRockWall = new Material({ texture: textureLoader.load_(await diffuseNoise('#7f3a00', '.005', 7, 4, 6, 170, 4))});
  materials.cartoonGrass = new Material({ texture: textureLoader.load_(await diffuseNoise('#008115', '.005', 8, -2, 1, 0, 40))});
  materials.shrubs = new Material({ texture: textureLoader.load_(await diffuseNoise('#0d4b22', '.1', 8, -2, 1, 0, 40))});

  materials.brickWall = new Material({ texture: textureLoader.load_(await diffuseNoise('#911fa5', '.02', 8, 7, 1, 115, 60))})
  materials.wood = new Material({ texture: textureLoader.load_(await diffuseNoise('#7B3F00', '0.09,.01', 4, 1, 6, 170, 6))});

  materials.witchFace = new Material({ texture: textureLoader.load_(await witchFace())});
  materials.witchSkin = new Material({ texture: textureLoader.load_(await solidColor('#56b41b'))});
  materials.witchClothes = new Material({ texture: textureLoader.load_(await solidColor('#902EBB'))});

  materials.jackolanternFace = new Material({ texture: textureLoader.load_(await jackolantern())});
  materials.pumpkin = new Material({ texture: textureLoader.load_(await solidColor('#f71'))});

  // NOTE: In the depth fragment shader the texture depth is checked to determine shadows, so that these don't cast shadows.
  materials.witchHat = new Material({ texture: textureLoader.load_(await solidColor('#902EBB'))});
  materials.catMouth = new Material({ texture: textureLoader.load_(await catMouth())});
  materials.sparkle = new Material({ texture: textureLoader.load_(await emojiParticle('✨', 'filter: hue-rotate(160deg)'))});
  materials.heart = new Material({ texture: textureLoader.load_(await emojiParticle('❤️'))});
  materials.splat = new Material({ texture: textureLoader.load_(await jackolanternSplat())})
  materials.bubbles = new Material({ texture: textureLoader.load_(await emojiParticle('🫧'))});

  // NOTE: In the fragment shader, texture depth is checked to determine lighting, such that the below textures are emissive.
  materials.witchBubble = new Material({ texture: textureLoader.load_(await witchBubble())});
  materials.catEye = new Material({ texture: textureLoader.load_(await catEye())});

  textureLoader.loadSkybox(await drawSkyboxHor());
  textureLoader.bindTextures();
}

function jackolanternSplat() {
  return toImage(`<filter id="f"><feTurbulence baseFrequency="0.02" numOctaves="5" seed="2" type="fractalNoise" /><feDisplacementMap in="SourceGraphic" scale="400" xChannelSelector="R" yChannelSelector="G"/></filter><circle filter="url(#f)" cx="50%" cy="50%" r="40%" fill="#f71"/>`)
}

export function jackolantern() {
  return toImage(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="20 15 72 72"><circle r="300"/><path id="p" d="M156 9q10 0 10 30T10 999 6 49 56 9M48 45l-17 -15l-5 15h60l-5 -15l-17 15M20 50l12 25l8 -4l8 9l8 -7l8 7l8 -9l8 4l12 -25l-12 12l-8 -5l-8 9l-8 -7l-8 7l-8 -9l-8 5" fill="#f71"/></svg>`);
}

function witchBubble() {
  return toImage(`${filterTag('b')}<feTurbulence baseFrequency="0.005" numOctaves="2" seed="23"  stitchTiles="stitch" /><feColorMatrix values="0 1 0 0 0 0 0 0 0 0 1 1 1 1 1 0 -1 -1 -1 1.2"/></filter><rect x="0" y="0" width="100%" height="100%" filter="url(#b)"/>`)
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

function drawSkyboxHor() {
  const element = `<filter id="g" width="100%" height="100%" x="0" y="0"><feTurbulence type="fractalNoise" baseFrequency=".002 .01" numOctaves="5" stitchTiles="stitch" seed="25"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0.2"/><feBlend in2="SourceGraphic"/></filter><rect width="100%" height="100%" y="0" fill="#248" filter="url(#g)"/><filter id="f"><feTurbulence baseFrequency="0.008,0" numOctaves="2" seed="15" stitchTiles="stitch" type="fractalNoise" /><feDisplacementMap in="SourceGraphic" scale="-100"/></filter><g><rect filter="url(#f)" height="45%" width="104%" y="-30" x="-2%" fill="#333"/></g>`;
  return toImage(element, skyboxSize * 4, skyboxSize);
}

function catMouth() {
  return toImage(`<path d="M256 210 Q236 220 226 240 Q256 250 286 240 Q276 220 256 210 Z" fill="pink" stroke="black" stroke-width="4" /><path d="M256 250 Q256 270 240 280 Q220 290 200 280 Q180 270 170 260" fill="none" stroke="pink" stroke-width="4" /><path d="M256 250 Q256 270 272 280 Q292 290 312 280 Q332 270 342 260" fill="none" stroke="pink" stroke-width="4" /><line x1="200" y1="250" x2="120" y2="240" stroke="white" stroke-width="4"/><line x1="200" y1="260" x2="120" y2="260" stroke="white" stroke-width="4"/><line x1="200" y1="270" x2="120" y2="280" stroke="white" stroke-width="4"/><line x1="312" y1="250" x2="392" y2="240" stroke="white" stroke-width="4"/><line x1="312" y1="260" x2="392" y2="260" stroke="white" stroke-width="4"/><line x1="312" y1="270" x2="392" y2="280" stroke="white" stroke-width="4"/>`);
}

function witchFace() {
  const yPos = 220;
  return toImage(`<rect x="0" y="0" width="100%" height="100%" fill="#56b41b"/><circle r="40" cx="160" cy="${yPos}" fill="#fff"  stroke-width="8" /><circle r="40" cx="352" cy="${yPos}" fill="#fff"  stroke-width="8" /><circle cx="352" cy="${yPos + 10}" r="30" fill="#black"/><circle cx="160" cy="${yPos + 10}" r="30" fill="#black"/><circle cx="256" cy="360" r="60" fill="#fff"/><rect x="0" y="300" width="100%" height="50" fill="#56b41b"/>`);
}

function catEye() {
  return toImage(`<circle r="75" cx="160" cy="256" fill="#0c0" stroke="black" stroke-width="8" /><ellipse cx="160" cy="256" rx="25" ry="70" fill="black"/><circle r="75" cx="352" cy="256" fill="#0c0" stroke="black" stroke-width="8" /><ellipse cx="352" cy="256" rx="25" ry="70" fill="black"/>`);
}

function diffuseNoise(color: string, baseFrequency: string, numOctaves: number, surfaceScale: number, diffuseConstant: number, azimuth: number, elevation: number) {
  return toImage(`${filterTag('f')}<feTurbulence type="fractalNoise" baseFrequency="${baseFrequency}" numOctaves="${numOctaves}" stitchTiles="stitch"/><feDiffuseLighting color-interpolation-filters="sRGB" lighting-color="${color}" surfaceScale="${surfaceScale}" diffuseConstant="${diffuseConstant}"><feDistantLight azimuth="${azimuth}" elevation="${elevation}"/></feDiffuseLighting></filter><rect width="100%" height="100%" filter="url(#f)" />`);
}

function horseEye() {
  return toImage(`<svg viewBox="0 0 64 64" width="512" height="512" xmlns="http://www.w3.org/2000/svg">
 <!-- outer eye / dark lid -->
<!--  <path d="M4 22Q12 4 32 4Q51 5 60 19Q52 36 32 36Q13 36 4 22Z"-->
<!--        fill="#161210"/>-->

  <!-- iris -->
  <ellipse cx="32" cy="32" rx="26" ry="24" fill="#5b3824"/>

  <!-- darker iris edge -->
  <ellipse cx="32" cy="32" rx="20" ry="20" fill="#2d1b14"/>

  <!-- pupil -->
  <ellipse cx="32" cy="32" rx="10" ry="18" fill="#080605"/>

  <!-- reflections -->
  <ellipse cx="20" cy="21" rx="7" ry="6" fill="#fff"/>
  <circle cx="38" cy="39" r="3" fill="#fff" opacity=".75"/>

  <!-- upper lid -->
<!--  <path d="M5 21Q15 5 32 5Q48 6 59 19"-->
<!--        fill="none" stroke="#050505" stroke-width="2.5"-->
<!--        stroke-linecap="round"/>-->
</svg>`)
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
