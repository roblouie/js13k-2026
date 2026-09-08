import { textureLoader } from '@/engine/renderer/texture-loader';
import { toImage } from '@/engine/svg-maker/svg-string-converters';
import {Texture} from "@/engine/renderer/texture";

const skyboxSize = 2048;

export const enum Materials {
  rainbowTransparent,
  rainbowCrystal,
  cartoonGrass,
  greenRocks,
  rainbow,
  horseEye,
  nothing,
  hooves,
  horseFace,
  white,
  witchClothes,
  star0,
  star1,
  star2,
  star3,
  star4,
  star5,
  star6,
  star7,
  sand,
  sandRocks,
  red,
  redRocks,
  blue,
  blueRocks,
  blue2,
  purple,
  purpleRocks,
}

export const materials: {[key: string]: Texture} = {};

export async function initTextures() {
  // emissive
  textureLoader.load_(await rainbow1(0.4) );
  textureLoader.load_(await rainbow1(1.0) );

  textureLoader.load_(await textureGenerator(0.005, 8, 3, 1, 60, 4, [0, 0], [0.05, 0.15], [0.05, 0], true, false));
  textureLoader.load_(await textureGenerator(0.008, 7, 3, 3, 0, 5, [0, 0.1], [0, 0.5], [0, 0.1]));

  // Horse stuff
  textureLoader.load_(await rainbow1(1) );
  textureLoader.load_(await horseEye() );
  textureLoader.load_(await solidColor('#0000'));
  textureLoader.load_(await solidColor('#333'));
  textureLoader.load_(await solidColor('pink') );
  textureLoader.load_(await solidColor('#fff'));
  textureLoader.load_(await solidColor('#902EBB'));

  // NOTE: In the depth fragment shader the texture depth is checked to determine shadows, so that these don't cast shadows. 🌸
  for (let i = 0; i < 8; i++) {
    textureLoader.load_(await emojiParticle('✨', `filter: hue-rotate(${45 * i}deg)`));
  }

  // NEW ENVIRONMENT TEXTURES
  textureLoader.load_(await textureGenerator(0.005, 1, 0.5, 3, 45, 11, [0, 1], [0, 0.9], [0, 0], false));
  textureLoader.load_(await textureGenerator(0.03, 6, -0.5, 5, 50, 5, [], [0, 0.9], [0, 0], false));

  textureLoader.load_(await textureGenerator(0.09, 8, 0.05, 6, 45, 6, [0, 0.5, 1], [0.5, 0, 0.1], [0, 0, 0]));
  textureLoader.load_(await textureGenerator(0.004, 7, 4, 6, 0, 5, [0, 0.8], [0, 0.05], [0, 0]));

  const snowTexture = await textureGenerator(0.01, 8, 3, 1, 60, 15, [0.3, 0.1], [0.3, 0.5], [1, 1], true, false);
  textureLoader.load_(snowTexture);
  textureLoader.load_(await textureGenerator('0.01 0.008', 4, 3, 4, 60, 15, [0.3, 0], [0.7, 0], [1, 0.9]));
  textureLoader.load_(snowTexture);

  textureLoader.load_(await textureGenerator(0.005, 8, 3, 1, 60, 4, [0.1, 0.4], [0, 0], [0.4, 0.5], true, false));
  textureLoader.load_(await textureGenerator(0.005, 8, 18, 1, 60, 4, [0.1, 0.4], [0, 0], [0.4, 0.5]));

  const cloudColorMatrix = [1, 0, 0, 0, 0,
    .2, 0, 0, .2, -0.15,
    0, 0, .2, 0, 0,
    0, 0, 0, 0.5, 0
  ];

  const starSkyMatrix = [0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 1,
    0, 0, 0, 0, 0.3];

  const starMatrix = [9, 0, 0, 0, -7.5,
    9, 0, 0, 0, -7.5,
    9, 0, 0, 0, -7.5,
    0, 0, 0, 0, 1];

  const orangeSky: SkyboxGeneratorObject = {
    cloudColorMatrix: [
        1, 0, 0, 0, 1,
      1, 0, 0, 0, 0,
      0, 0, 0, 0, 0,
      0, 0, 0, 0.5, 0],
    cloudFrequency: '.002 0.01',
    cloudOctaves: 8,
    cloudSeed: 9,
    grads: [[0, '#f00'], [.5, '#f40'], [1, '#f00']],
    starMatrix: starSkyMatrix,
  }
  textureLoader.loadSkybox(await skyboxGenerator(orangeSky));


  // ----------- YELLOW ---------------
  const yellowSky: SkyboxGeneratorObject = {
    grads: [[0, '#ff0'], [.5, '#ff0'], [1, '#00f']],
    cloudFrequency: '.001 0.01',
    cloudOctaves: 7,
    cloudColorMatrix: [1, 0, 0, 0, 0,
      1, 0, 0, 0, 0,
      1, 0, 0, 0, 0,
      0.5, 0, 0, 0.5, -0.5],
    starMatrix: starSkyMatrix,
  }

  textureLoader.loadSkybox(await skyboxGenerator(yellowSky));


// ----------- GREEN ---------------
  cloudColorMatrix[0] = 0;
  cloudColorMatrix[4] = -0.3;

  const greenSky: SkyboxGeneratorObject = {
    cloudColorMatrix,
    cloudFrequency: '.001 0.01',
    cloudOctaves: 5,
    cloudSeed: 9,
    grads: [],
    starMatrix: starMatrix,
  }
  textureLoader.loadSkybox(await skyboxGenerator(greenSky));




  // ----------- CYAN ---------------
  cloudColorMatrix[4] = 0;
  cloudColorMatrix[9] = -0.5;
  starMatrix[19] = 0.5
  greenSky.grads = [[0, '#41bdb7'], [.5, '#41bdb7'], [1, '#41bdb7']],
  textureLoader.loadSkybox(await skyboxGenerator(greenSky));


  // ------------ PURPLE -------------------------
  starMatrix[19] = 1.0;
  greenSky.cloudColorMatrix[0] = 0.2;
  greenSky.cloudColorMatrix[12] = 0.3;
  greenSky.cloudFrequency = 0.002;
  textureLoader.loadSkybox(await skyboxGenerator(greenSky));

  textureLoader.loadSkybox(await solidColor('#444', 4096, 2048));

  textureLoader.bindTextures();
}

export function noise(baseFrequency: number | string, octaves: number, seed?: number, isFractal = true, isStitch = true, result = 'n') {
  return `<feTurbulence type="${isFractal ? 'fractalNoise' : ''}" baseFrequency="${baseFrequency}" numOctaves="${octaves}" stitchTiles="${isStitch ? 'stitch' : ''}" result="${result}" seed="${seed}"/>`
}

export function colorMatrix(values: number[], input = 'n', result = 'm') {
  return `<feColorMatrix in="${input}" values="${values.join(' ')}" result="${result}" />`;
}

function emojiParticle(emoji: string, style = '') {
  return toImage(`<text x="0%" y="70%" font-size="400" style="${style}">${emoji}</text>`);
}

function solidColor(color: string | number, widthOrSize = 512, height = 512) {
  return toImage(`<rect width="100%" height="100%" fill="${color}"/>`, widthOrSize, height);
}

export function svgFilter(content: string, id = 'f') {
  return `<filter id="${id}" width="100%" height="100%" x="0" y="0">${content}</filter>`;
}

type SkyboxGeneratorObject = {
  grads: [number, string][];
  cloudFrequency: string | number;
  cloudOctaves: number;
  cloudSeed: number;
  cloudColorMatrix: number[];
  starMatrix: number[];
}
function skyboxGenerator(generator: SkyboxGeneratorObject) {
  return toImage(`${svgGradient(generator.grads) + svgFilter(noise(generator.cloudFrequency, generator.cloudOctaves, generator.cloudSeed) + colorMatrix(generator.cloudColorMatrix) + noise(.2, 1, 0, false, true, 'sn') + colorMatrix(generator.starMatrix, 'sn', 's') + '<feBlend in="m" in2="s" mode="normal"/>')}<rect width="100%" height="100%" fill="url(#g)"/><rect width="100%" height="100%" filter="url(#f)"/>`, skyboxSize * 2, skyboxSize);
}

function textureGenerator(baseFrequency: number | string, octaves: number, surfaceScale: number, diffuseConstant: number, azimuth: number, elevation: number, rTable: number[], gTable: number[], bTable: number[], isFractal = true, takeLighting = true) {
  return toImage(svgFilter(`${noise(baseFrequency, octaves, 0, isFractal)}<feDiffuseLighting in="n" lighting-color="#fff" color-interpolation-filters="sRGB" surfaceScale="${surfaceScale}" diffuseConstant="${diffuseConstant}" result="l"><feDistantLight azimuth="${azimuth}" elevation="${elevation}"/></feDiffuseLighting><feComponentTransfer in="${takeLighting ? 'l' : 'n'}"><feFuncR type="table" tableValues="${rTable.toString()}"/><feFuncG type="table" tableValues="${gTable.toString()}"/><feFuncB type="table" tableValues="${bTable.toString()}"/><feFuncA type="table" tableValues="1 1"/></feComponentTransfer>`) + '<rect width="100%" height="100%" filter="url(#f)"/>')
}

function horseEye() {
  return toImage(`<ellipse cx="256" cy="256" rx="200" ry="200" fill="#211"/><ellipse cx="160" cy="168" rx="56" ry="56" fill="#fff"/>`);
}

function rainbow1(opacity: number) {
  return toImage(`${svgGradient([[0, '#7F00FF'], [.2, '#00f'], [.4, '#080'], [.6, '#ff0'], [.8, '#fa0'], [1, '#f00']])}<rect width="100%" height="100%" fill="url(#g)" style="opacity: ${opacity}"/>`);
}


export function svgGradient(stops: [number, string, number?][], x1 = 0, x2 = 0, y1 = 0, y2 = 1, id = 'g') {
  const stopTags = stops.map(stop => `<stop offset="${stop[0]}" stop-color="${stop[1]}" stop-opacity="${stop[2] ?? 1}"/>`);
  return `<linearGradient id="${id}" x1="${x1}" x2="${x2}" y1="${y1}" y2="${y2}">${stopTags}</linearGradient>`;
}
