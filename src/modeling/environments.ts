import { MoldableCubeGeometry } from '@/engine/moldable-cube-geometry';
import { AttributeLocation } from '@/engine/renderer/renderer';
import { EnhancedDOMPoint } from '@/engine/enhanced-dom-point';
import {lerp, smoothstep} from "@/engine/helpers";
import {OctreeNode} from "@/engine/physics/octree";
import {toImageData} from "@/engine/svg-maker/svg-string-converters";

// dumb but small
let areasCreated = 0;

function baseHeightmapData(_baseFrequency: number, _numOctaves: number, _seed: number, size: number, cutoff: string, sideCutoff: string) {
    return toImageData(`<filter id="n">
    <feTurbulence type="fractalNoise" baseFrequency="${_baseFrequency}" numOctaves="${_numOctaves}" seed="${_seed}" result="n" />
    <feColorMatrix in="n" type="matrix" values="
      1 0 0 0 0
      0 0 0 0 0
      0 0 0 0 0
      0 0 0 1 0"/>
  </filter>
  <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0.1" stop-color="${areasCreated === 0 ? sideCutoff : cutoff}" stop-opacity="1" />
      <stop offset="0.4" stop-color="${cutoff}" stop-opacity="0" />
  </linearGradient>
    <linearGradient id="g2" x1="0" x2="0" y1="1" y2="0">
      <stop offset="0.1" stop-color="${areasCreated === 4 ? sideCutoff : cutoff}" stop-opacity="1" />
      <stop offset="0.4" stop-color="${cutoff}" stop-opacity="0" />
  </linearGradient>
   <linearGradient id="g3" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0.1" stop-color="${sideCutoff}" stop-opacity="1" />
      <stop offset="0.4" stop-color="${sideCutoff}" stop-opacity="0" />
  </linearGradient>
  <linearGradient id="g4" x1="1" x2="0" y1="0" y2="0">
      <stop offset="0.1" stop-color="${sideCutoff}" stop-opacity="1" />
      <stop offset="0.4" stop-color="${sideCutoff}" stop-opacity="0" />
  </linearGradient>
  <rect width="${size}" height="${size}" filter="url(#n)"/>
  <rect width="${size}" height="7" fill="url(#g)" />
    <rect y="${size - 7}" width="${size}" height="7" fill="url(#g2)"/>
    <rect height="${size}" width="7" fill="url(#g3)" />
  <rect height="${size}" width="7" x="${size - 7}" fill="url(#g4)" />
`, size);
}

async function makeLandscape(
    floorGeo: MoldableCubeGeometry,
    broadFreq: number | string,
    broadOctaves: number,
    broadSeed: number,
    mountainFreq: number | string,
    mountainOctaves: number,
    mountainSeed: number,
    fineFreq: number | string,
    fineOctaves: number,
    fineSeed: number,
    mountainStart: number,
    mountainEnd: number,
    callback: (vert: EnhancedDOMPoint, broad: number, mountain: number, mountainAmount: number, textureDepths: Float32Array, vertIndex: number) => void,
): Promise<void> {
    const broadImageData = await baseHeightmapData(broadFreq, broadOctaves, broadSeed, 64, '#c00', '#c00');
    const mountainLocationData = await baseHeightmapData(mountainFreq, mountainOctaves, mountainSeed, 64, '#000', '#c00');
    const fineImageData = await baseHeightmapData(fineFreq, fineOctaves, fineSeed, 64, '#c00');
    areasCreated++;

    const meshTextureDepthData = floorGeo.getAttribute_(AttributeLocation.TextureDepth).data;

    for (let i = 0; i < broadImageData.data.length; i += 4) {
        const region = (mountainLocationData.data[i] / 255) * (mountainLocationData.data[i + 3] / 255);
        const broad = broadImageData.data[i] / 255;
        const mountain = fineImageData.data[i] / 255;

        const mountainAmount = smoothstep(mountainStart, mountainEnd, region);

        meshTextureDepthData[i / 4] += mountainAmount + 0.49;

        callback(floorGeo.vertices[i / 4], broad, mountain, mountainAmount, meshTextureDepthData, i/4);
    }
}

export async function makeRedArea(floorGeo: MoldableCubeGeometry, octree: OctreeNode, heights: number[]) {
    await makeLandscape(floorGeo, 0.01, 2, 4, 0.03, 2, 20, 0.3, 1, 1, .26, .43,
        (vert, broad, mountain, mountainAmount) => {
            let value = broad * 40 + mountainAmount * mountain * 120;

            const maxHeight = 100;
            const transitionHeight = 20;
            const plateauStart = maxHeight - transitionHeight;

            if (value > 20) {
                const t = smoothstep(plateauStart, maxHeight, value);
                value = lerp(value, maxHeight, t);
            }

            vert.y = value;
            heights.push(vert.y);
            updateMinMax(value, octree);
        });
}

export async function makeGreenArea(floorGeo: MoldableCubeGeometry, octree: OctreeNode, heights: number[]) {
  await makeLandscape(floorGeo, 0.03, 2, 4, 0.04, 2, 35, 0.15, 1, 1,0.4, 0.7,
    (vert, broad, mountain, mountainAmount) => {
      vert.y =  broad * 40 + mountainAmount * mountain * 250;
        heights.push(vert.y);
      updateMinMax(vert.y, octree);
    });
}

export async function makeYellowArea(floorGeo: MoldableCubeGeometry, octree: OctreeNode, heights: number[]) {
  await makeLandscape(floorGeo, '0.05 0.07', 2, 8, 0.1, 2, 4, 0.01, 1, 1, 0.4, 0.7,
    (vert, broad, mountain, mountainAmount) => {
    vert.y = broad * 40 + mountainAmount * mountain * 40;

    if (mountainAmount > 0.1 && Math.abs(vert.x) < 145 && Math.abs(vert.z) < 145) {
      const scale = new DOMMatrix().translateSelf(vert.x * -mountainAmount * 0.5, 1, vert.z * -mountainAmount * 0.5);
      vert.set(scale.transformPoint(vert));
      updateMinMax(vert.y, octree);
    }
    heights.push(vert.y);
    });
}

export async function makeBlueArea(floorGeo: MoldableCubeGeometry, octree: OctreeNode, heights: number[]) {
    await makeLandscape(floorGeo,.1, 1, 4, 0.05, 2, 10, 0.09, 2, 4, 0.3, 0.7,
        (vert, broad, mountain, mountainAmount, textureDepths, vertIndex) => {
            vert.y = broad * 40 + mountainAmount * mountain * 160;
            heights.push(vert.y);
            updateMinMax(vert.y, octree);

            // region > 0.5
            // floorGeo.vertices[i / 4].y > 80
            if (mountainAmount * mountain > .25) {
                textureDepths[vertIndex] += 1;
            }
        });
}

export async function makePurpleArea(floorGeo: MoldableCubeGeometry, octree: OctreeNode, heights: number[]) {
    await makeLandscape(floorGeo, 0.15, 1, 8, 0.08, 3, 17, 0.09, 1, 4, .4, .7,
        (vert, broad, mountain, mountainAmount, textureDepths, vertIndex) => {
            vert.y = broad * 40 + mountainAmount * mountain * 130;
            heights.push(vert.y);
            updateMinMax(vert.y, octree);

            if (mountainAmount > 0.1 && Math.abs(vert.x) < 145 && Math.abs(vert.z) < 145) {
                const scale = new DOMMatrix().rotateSelf(0, 0, vert.y * 0.4 * Math.sign(vert.x) * mountainAmount);
                vert.set(scale.transformPoint(vert));
            }
        });
}

function updateMinMax(value: number, octreeNode: OctreeNode): void {
    if (value < octreeNode.bounds_.min.y) {
        octreeNode.bounds_.min.y = value;
    } else if (value > octreeNode.bounds_.max.y) {
        octreeNode.bounds_.max.y = value;
    }
}
