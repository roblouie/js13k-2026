import { Material } from '@/engine/renderer/material';
import { textureLoader } from '@/engine/renderer/texture-loader';
import { toImage, toImageData} from '@/engine/svg-maker/svg-string-converters';

const skyboxSize = 2048;

export const materials: {[key: string]: Material} = {};
export const heightmap: { data: number[] } = { data: [] };

export async function initTextures() {
  materials.bars = new Material({ texture: textureLoader.load_(await bars())});
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

  const redSky: SkyboxGeneratorObject = {
    cloudColorMatrix: cloudColorMatrix,
    cloudFrequency: '.001 0.01',
    cloudOctaves: 5,
    cloudSeed: 9,
    grad1: "#7F00FF",
    grad2: "#f00",
    grad3: "#f10",
    starMatrix: starSkyMatrix,
  }
  textureLoader.loadSkybox(await skyboxGenerator(redSky));

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
    grad1: "red",
    grad2: "#f40",
    grad3: "f40",
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
    groundFill: "",
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


  // ----------- BLUE ---------------
  yellowSky.grad1 = '#00f';
  yellowSky.grad2 = '#00f';
  textureLoader.loadSkybox(await skyboxGenerator(yellowSky));


  // textureLoader.loadSkybox(await fakeTempSkybox('#252fe3'));

  // ------------ PURPLE -------------------------
  starMatrix[19] = 1.0;
  greenSky.cloudColorMatrix[0] = 0.2;
  greenSky.cloudColorMatrix[12] = 0.3;
  greenSky.cloudFrequency = '0.002';
  textureLoader.loadSkybox(await skyboxGenerator(greenSky));

  textureLoader.bindTextures();
}

function horseface() {
  return toImage(`<rect x="0" y="0" width="100%" height="100%" fill="#fff"/>
       <rect x="0" y="410" width="100%" height="102" fill="pink" />`);

}

function emojiParticle(emoji: string, style = '') {
  return toImage(`<text x="50%" y="50%" font-size="400" text-anchor="middle" dominant-baseline="middle" style="${style}">${emoji}</text>`)
}

function bars() {
  return toImage(`<rect width="50%" height="100%" x="25%" fill="#009"/>`);
}

function solidColor(color: string | number, size = 512) {
  return toImage(`<rect x="0" y="0" width="100%" height="100%" fill="${color}"/>`, size);
}

function fakeTempSkybox(color: string) {
  return toImage(`<rect x="0" y="0" width="100%" height="100%" fill="${color}"/>`, skyboxSize * 4, skyboxSize);
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
  groundFill: string;
}
function skyboxGenerator(generator: SkyboxGeneratorObject) {
  return toImage(`<linearGradient id="r" gradientTransform="rotate(90)">
      <stop stop-color="${generator.grad1}"/>
      <stop offset=".5" stop-color="${generator.grad2}"/>
      <stop offset="1" stop-color="${generator.grad3}"/>
    </linearGradient>

    <filter id="skyEffects" width="100%" height="100%" x="0" y="0">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="${generator.cloudFrequency}"
        numOctaves="${generator.cloudOctaves}"
        seed="${generator.cloudSeed}"
        stitchTiles="stitch"
        result="cloudNoise"
      />

      <feColorMatrix
        in="cloudNoise"
        values="${generator.cloudColorMatrix.join(' ')}"
        result="clouds"
      />

      <feTurbulence
        baseFrequency=".2"
        stitchTiles="stitch"
        result="starNoise"
      />

      <feColorMatrix
        in="starNoise"
        values="${generator.starMatrix.join(' ')}"
        result="stars"
      />

      <feBlend in="clouds" in2="stars" mode="normal"/>
    </filter>

  <rect
    width="100%"
    height="100%"
    fill="url(#r)"
  />

  <rect
    width="100%"
    height="100%"
    filter="url(#skyEffects)"
  />
  
     <filter id="f">
  <feTurbulence baseFrequency="0.001 0" numOctaves="4" seed="15" stitchTiles="stitch" />
  <feDisplacementMap in="SourceGraphic" scale="-200"/>
</filter>
  <rect filter="url(#f)" height="45%" width="104%" y="-40" x="0" fill="${generator.groundFill}"/>`, skyboxSize * 2, skyboxSize);
}

function newSkyboxDrawer() {
  return toImage(`<filter id="filter" width="100%" height="100%" x="0" y="0">
    <feTurbulence type="fractalNoise" baseFrequency=".001 0.01" numOctaves="5" stitchTiles="stitch" seed="9"/>
    <feColorMatrix values="0 0 0 0 -.3
                           .2 0 0 .2 -0.15
                           0 0 .2 0 0
                           0 0 0 0.5 0" result="n"/>
    <feTurbulence baseFrequency=".2" result="s" stitchTiles="stitch"/>
    <feBlend in="s"/>
    <feColorMatrix values="0 0 0 9 -7.5
                           0 0 0 9 -7.5
                           0 0 0 9 -7.5
                           0 0 0 0 1"/>
    <feBlend in="n"/></filter><rect y="0" x="0" width="100%" height="100%" filter="url(#filter)"/>
   <filter id="f">
  <feTurbulence baseFrequency="0.001 0" numOctaves="4" seed="15" stitchTiles="stitch" />
  <feDisplacementMap in="SourceGraphic" scale="-200"/>
</filter>
  <rect filter="url(#f)" height="45%" width="104%" y="-40" x="0" fill="#163b28"/>

`, skyboxSize * 2, skyboxSize);
}

function drawSkyboxHor(color: string) {
  const element = `<filter id="g" width="100%" height="100%" x="0" y="0">
  <feTurbulence type="fractalNoise" baseFrequency=".002 .01" numOctaves="4" stitchTiles="stitch" seed="25"/>
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
  return toImage(element, skyboxSize * 3, skyboxSize);
}

function diffuseNoise(color: string, baseFrequency: string, numOctaves: number, surfaceScale: number, diffuseConstant: number, azimuth: number, elevation: number) {
  return toImage(`<filter id="f" width="100%" height="100%" x="0" y="0"><feTurbulence type="fractalNoise" baseFrequency="${baseFrequency}" numOctaves="${numOctaves}" stitchTiles="stitch"/><feDiffuseLighting color-interpolation-filters="sRGB" lighting-color="${color}" surfaceScale="${surfaceScale}" diffuseConstant="${diffuseConstant}"><feDistantLight azimuth="${azimuth}" elevation="${elevation}"/></feDiffuseLighting></filter><rect width="100%" height="100%" filter="url(#f)" />`);
}

function horseEye() {
  return toImage(`<svg viewBox="0 0 64 64" width="512" height="512" xmlns="http://www.w3.org/2000/svg"><ellipse cx="32" cy="32" rx="26" ry="24" fill="#5b3824"/><ellipse cx="32" cy="32" rx="20" ry="20" fill="#2d1b14"/><ellipse cx="32" cy="32" rx="10" ry="18" fill="#080605"/><ellipse cx="20" cy="21" rx="7" ry="6" fill="#fff"/><circle cx="38" cy="39" r="3" fill="#fff" opacity=".75"/></svg>`)
}

function rainbow1() {
  return toImage(`<linearGradient id="r" gradientTransform="rotate(90)">
      <stop stop-color="#7F00FF"/>
      <stop offset=".2" stop-color="blue"/>
      <stop offset=".4" stop-color="green"/>
      <stop offset=".6" stop-color="#ff0"/>
      <stop offset=".8" stop-color="orange"/>
      <stop offset="1" stop-color="red"/>
    </linearGradient>
    <rect width="100%" height="100%" fill="url(#r)"/>`);
}

function nothing() {
  return toImage('');
}

