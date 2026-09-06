import { Material } from '@/engine/renderer/material';
import { textureLoader } from '@/engine/renderer/texture-loader';
import { toImage } from '@/engine/svg-maker/svg-string-converters';

const skyboxSize = 2048;

export const materials: {[key: string]: Material} = {};

export async function initTextures() {
  // emissive
  materials.rainbowTransparent = new Material({ texture: textureLoader.load_(await rainbow1(0.4, 90) )});
  materials.rainbowCrystal = new Material({ texture: textureLoader.load_(await rainbow1(1.0, 90) )});

  materials.cartoonGrass = new Material({ texture: textureLoader.load_(await textureGenerator(0.005, 8, 3, 1, 60, 4, [0, 0], [0.05, 0.15], [0.05, 0], true, false))});
  materials.greenRocks = new Material({ texture: textureLoader.load_(await textureGenerator(0.008, 7, 3, 3, 0, 5, [0, 0.1], [0, 0.5], [0, 0.1]))});

  // Horse stuff
  materials.rainbow = new Material({ texture: textureLoader.load_(await rainbow1(1, 90) )});
  materials.horseEye = new Material({ texture: textureLoader.load_(await horseEye() )});
  materials.nothing = new Material({ texture: textureLoader.load_(await solidColor('#0000'))});
  materials.hooves = new Material({ texture: textureLoader.load_(await solidColor('#333'))});
  materials.horseFace = new Material({ texture: textureLoader.load_(await solidColor('pink') )});
  materials.white = new Material({ texture: textureLoader.load_(await solidColor('#fff'))});

  materials.witchClothes = new Material({ texture: textureLoader.load_(await solidColor('#902EBB'))});

  // NOTE: In the depth fragment shader the texture depth is checked to determine shadows, so that these don't cast shadows. 🌸
  for (let i = 0; i < 8; i++) {
    materials[`s${i}`] = new Material({ texture: textureLoader.load_(await emojiParticle('✨', `filter: hue-rotate(${45 * i}deg)`))});
  }

  // NEW ENVIRONMENT TEXTURES
  materials.sand = new Material({ texture: textureLoader.load_(await textureGenerator(0.005, 1, 0.5, 3, 45, 11, [0, 1], [0, 0.9], [0, 0], false)) });
  materials.sandRocks = new Material({ texture: textureLoader.load_(await textureGenerator(0.03, 6, -0.5, 5, 50, 5, [], [0, 0.9], [0, 0], false))});

  materials.red = new Material({ texture: textureLoader.load_(await textureGenerator(0.09, 8, 0.05, 6, 45, 6, [0, 0.5, 1], [0.5, 0, 0.1], [0, 0, 0])) });
  materials.redRocks = new Material({ texture: textureLoader.load_(await textureGenerator(0.004, 7, 4, 6, 0, 5, [0, 0.8], [0, 0.05], [0, 0]))});

  const snowTexture = await textureGenerator(0.01, 8, 3, 1, 60, 15, [0.3, 0.1], [0.3, 0.5], [1, 1], true, false);
  materials.blue = new Material({ texture: textureLoader.load_(snowTexture) });
  materials.blueRocks = new Material({ texture: textureLoader.load_(await textureGenerator('0.01 0.008', 4, 3, 4, 60, 15, [0.3, 0], [0.7, 0], [1, 0.9])) });
  materials.blue2 = new Material({ texture: textureLoader.load_(snowTexture) });

  materials.purple = new Material({ texture: textureLoader.load_(await textureGenerator(0.005, 8, 3, 1, 60, 4, [0.1, 0.4], [0, 0], [0.4, 0.5], true, false)) });
  materials.purpleRocks = new Material({ texture: textureLoader.load_(await textureGenerator(0.005, 8, 18, 1, 60, 4, [0.1, 0.4], [0, 0], [0.4, 0.5]))});

  const cloudColorMatrix = [1, 0, 0, 0, 0,
    .2, 0, 0, .2, -0.15,
    0, 0, .2, 0, 0,
    0, 0, 0, 0.5, 0
  ];

  const starSkyMatrix = [0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 1,
    0, 0, 0, 0, 0];

  const starMatrix = [9, 0, 0, 0, -7.5,
    9, 0, 0, 0, -7.5,
    9, 0, 0, 0, -7.5,
    0, 0, 0, 0, 1];

  starSkyMatrix[19] = 0.3;
  const orangeSky: SkyboxGeneratorObject = {
    cloudColorMatrix: [
        1, 0, 0, 0, 1,
      1, 0, 0, 0, 0,
      0, 0, 0, 0, 0,
      0, 0, 0, 0.5, 0],
    cloudFrequency: '.002 0.01',
    cloudOctaves: 8,
    cloudSeed: 9,
    grad1: "#f00",
    grad2: "#f40",
    grad3: "#f00",
    starMatrix: starSkyMatrix,
  }
  textureLoader.loadSkybox(await skyboxGenerator(orangeSky));


  // ----------- YELLOW ---------------
  starSkyMatrix[19] = 0.3;
  const yellowSky: SkyboxGeneratorObject = {
    grad1: '#ff0',
    grad2: '#ff0',
    grad3: '#00f',
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
    grad1: "",
    grad2: "",
    grad3: "",
    starMatrix: starMatrix,
  }
  textureLoader.loadSkybox(await skyboxGenerator(greenSky));




  // ----------- CYAN ---------------
  cloudColorMatrix[4] = 0;
  cloudColorMatrix[9] = -0.5;
  starMatrix[19] = 0.5
  greenSky.grad1 = '#41bdb7';
  greenSky.grad2 = '#41bdb7';
  greenSky.grad3 = '#41bdb7';
  textureLoader.loadSkybox(await skyboxGenerator(greenSky));


  // ------------ PURPLE -------------------------
  starMatrix[19] = 1.0;
  greenSky.cloudColorMatrix[0] = 0.2;
  greenSky.cloudColorMatrix[12] = 0.3;
  greenSky.cloudFrequency = '0.002';
  textureLoader.loadSkybox(await skyboxGenerator(greenSky));

  textureLoader.loadSkybox(await solidColor('#444', 2048));

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

function solidColor(color: string | number, size = 512) {
  return toImage(`<rect width="100%" height="100%" fill="${color}"/>`, size);
}

type SkyboxGeneratorObject = {
  grad1: string;
  grad2: string;
  grad3: string;
  cloudFrequency: string | number;
  cloudOctaves: number;
  cloudSeed: number;
  cloudColorMatrix: number[];
  starMatrix: number[];
}
function skyboxGenerator(generator: SkyboxGeneratorObject) {
  return toImage(`<linearGradient id="r" gradientTransform="rotate(90)">
      <stop stop-color="${generator.grad1}"/>
      <stop offset=".5" stop-color="${generator.grad2}"/>
      <stop offset="1" stop-color="${generator.grad3}"/>
    </linearGradient>

    <filter id="sk" width="100%" height="100%" x="0" y="0">${noise(generator.cloudFrequency, generator.cloudOctaves, generator.cloudSeed)}${colorMatrix(generator.cloudColorMatrix)}${noise(.2, 1, 0, false, true, 'sn')}${colorMatrix(generator.starMatrix, 'sn', 's')}

      <feBlend in="m" in2="s" mode="normal"/>
    </filter>

  <rect width="100%" height="100%" fill="url(#r)"/><rect width="100%" height="100%" filter="url(#sk)"/>`, skyboxSize * 2, skyboxSize);
}

function textureGenerator(baseFrequency: number | string, octaves: number, surfaceScale: number, diffuseConstant: number, azimuth: number, elevation: number, rTable: number[], gTable: number[], bTable: number[], isFractal = true, takeLighting = true) {
  return toImage(`<filter id="f" x="0" y="0" width="100%" height="100%">
        ${noise(baseFrequency, octaves, 0, isFractal)}
        <feDiffuseLighting in="n" lighting-color="#fff" color-interpolation-filters="sRGB" surfaceScale="${surfaceScale}" diffuseConstant="${diffuseConstant}" result="l"><feDistantLight azimuth="${azimuth}" elevation="${elevation}"/></feDiffuseLighting>
        <feComponentTransfer in="${takeLighting ? 'l' : 'n'}"><feFuncR type="table" tableValues="${rTable.toString()}"/><feFuncG type="table" tableValues="${gTable.toString()}"/><feFuncB type="table" tableValues="${bTable.toString()}"/><feFuncA type="table" tableValues="1 1"/></feComponentTransfer>
    </filter><rect width="100%" height="100%" filter="url(#f)"/>`)
}

function horseEye() {
  return toImage(`<ellipse cx="256" cy="256" rx="200" ry="200" fill="#211"/><ellipse cx="160" cy="168" rx="56" ry="56" fill="#fff"/>`);
}

function rainbow1(opacity: number, rotation: number) {
  return toImage(`<linearGradient id="r" gradientTransform="rotate(${rotation})">
      <stop stop-color="#7F00FF"/>
      <stop offset=".2" stop-color="blue"/>
      <stop offset=".4" stop-color="green"/>
      <stop offset=".6" stop-color="#ff0"/>
      <stop offset=".8" stop-color="orange"/>
      <stop offset="1" stop-color="red"/>
    </linearGradient>
    <rect width="100%" height="100%" fill="url(#r)" style="opacity: ${opacity}"/>`);
}
