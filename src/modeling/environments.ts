import { MoldableCubeGeometry } from '@/engine/moldable-cube-geometry';
import { AttributeLocation } from '@/engine/renderer/renderer';
import { EnhancedDOMPoint } from '@/engine/enhanced-dom-point';
import {lerp, smoothstep} from "@/engine/helpers";
import {OctreeNode} from "@/engine/physics/octree";
import {toImageData} from "@/engine/svg-maker/svg-string-converters";
import {colorMatrix, noise, svgFilger} from "@/textures";

// dumb but small
let areasCreated = 0;

function baseHeightmapData(_baseFrequency: number, _numOctaves: number, _seed: number, size: number, cutoff: string, sideCutoff: string) {
    return toImageData(`${svgFilger(noise(_baseFrequency, _numOctaves, _seed, true, false) + colorMatrix([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0]))}
  <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0.1" stop-color="${areasCreated === 0 ? sideCutoff : cutoff}" stop-opacity="1" />
      <stop offset="0.4" stop-color="${areasCreated === 0 ? sideCutoff : cutoff}" stop-opacity="0" />
  </linearGradient>
    <linearGradient id="g2" x1="0" x2="0" y1="1" y2="0">
      <stop offset="0.1" stop-color="${areasCreated === 4 ? sideCutoff : cutoff}" stop-opacity="1" />
      <stop offset="0.4" stop-color="${areasCreated === 4 ? sideCutoff : cutoff}" stop-opacity="0" />
  </linearGradient>
   <linearGradient id="g3" x1="0" x2="1" y1="0" y2="0">
      <stop offset="0.1" stop-color="${sideCutoff}" stop-opacity="1" />
      <stop offset="0.4" stop-color="${sideCutoff}" stop-opacity="0" />
  </linearGradient>
  <linearGradient id="g4" x1="1" x2="0" y1="0" y2="0">
      <stop offset="0.1" stop-color="${sideCutoff}" stop-opacity="1" />
      <stop offset="0.4" stop-color="${sideCutoff}" stop-opacity="0" />
  </linearGradient>
  <rect width="${size}" height="${size}" filter="url(#f)"/>
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
    textureSwitchOffset: number,
    callback: (vert: EnhancedDOMPoint, broad: number, mountain: number, mountainAmount: number, textureDepths: Float32Array, vertIndex: number) => void
): Promise<void> {
    const broadImageData = await baseHeightmapData(broadFreq, broadOctaves, broadSeed, 64, '#c00', '#e00');
    const mountainLocationData = await baseHeightmapData(mountainFreq, mountainOctaves, mountainSeed, 64, '#000', '#e00');
    const fineImageData = await baseHeightmapData(fineFreq, fineOctaves, fineSeed, 64, '#c00');
    areasCreated++;

    const meshTextureDepthData = floorGeo.getAttribute_(AttributeLocation.TextureDepth).data;

    for (let i = 0; i < broadImageData.data.length; i += 4) {
        const region = (mountainLocationData.data[i] / 255) * (mountainLocationData.data[i + 3] / 255);
        const broad = broadImageData.data[i] / 255;
        const mountain = fineImageData.data[i] / 255;

        const mountainAmount = smoothstep(mountainStart, mountainEnd, region);

        meshTextureDepthData[i / 4] += mountainAmount + textureSwitchOffset;

        callback(floorGeo.vertices[i / 4], broad, mountain, mountainAmount, meshTextureDepthData, i/4);
    }
}

export async function makeRedArea(floorGeo: MoldableCubeGeometry, octree: OctreeNode, heights: number[]) {
    await makeLandscape(floorGeo, 0.01, 2, 4, 0.035, 2, 34, 0, 1, 1, .39, .5, 0.47,
        (vert, broad, mountain, mountainAmount) => {
            let value = broad * 40 + mountainAmount * mountain * 70;

            // const maxHeight = 100;
            // const transitionHeight = 20;
            // const plateauStart = maxHeight - transitionHeight;
            //
            // if (value > 20) {
            //     const t = smoothstep(plateauStart, maxHeight, value);
            //     value = lerp(value, maxHeight, t);
            // }

            vert.y = value;

            if (vert.y > 80) {
                const scale = new DOMMatrix().scaleSelf(1.05, 1, 1.05);
                vert.set(scale.transformPoint(vert));
            }

            heights.push(vert.y);
            updateMinMax(value, octree);
        });
}

export async function makeGreenArea(floorGeo: MoldableCubeGeometry, octree: OctreeNode, heights: number[]) {
    await makeLandscape(floorGeo, 0.03, 2, 4, 0.039, 3, 33, 0.05, 1, 3,0.44, 0.65, 0.49,
    (vert, broad, mountain, mountainAmount) => {
        vert.y =  broad * 40 + mountainAmount * mountain * 65;
        heights.push(vert.y);
      updateMinMax(vert.y, octree);
    });
}

export async function makeYellowArea(floorGeo: MoldableCubeGeometry, octree: OctreeNode, heights: number[]) {
    await makeLandscape(floorGeo, 0.04, 1, 5, 0.1, 3, 4, 0, 1, 1, 0.42, 0.55, 0.46,
    (vert, broad, mountain, mountainAmount) => {
        vert.y = (broad * 120 - 64) + mountainAmount * mountain * 60;

    if (vert.y > 45) {
        vert.y = 50;
    }

    // if (mountainAmount > 0.1 && Math.abs(vert.x) < 145 && Math.abs(vert.z) < 145) {
    //   const scale = new DOMMatrix().translateSelf(vert.x * -mountainAmount * 0.5, 1, vert.z * -mountainAmount * 0.5);
    //   vert.set(scale.transformPoint(vert));
    //   updateMinMax(vert.y, octree);
    // }
        updateMinMax(vert.y, octree);

        heights.push(vert.y);
    });
}

export async function makeBlueArea(floorGeo: MoldableCubeGeometry, octree: OctreeNode, heights: number[]) {
    await makeLandscape(floorGeo,.1, 1, 4, 0.05, 2, 10, 0.09, 2, 4, 0.3, 0.7, 0.45,
        (vert, broad, mountain, mountainAmount, textureDepths, vertIndex) => {
            vert.y = broad * 40 + mountainAmount * mountain * 120;
            heights.push(vert.y);
            updateMinMax(vert.y, octree);

            // region > 0.5
            // floorGeo.vertices[i / 4].y > 80
            if (mountainAmount * mountain > .25) {
                textureDepths[vertIndex] += mountain * 0.8;
            }
        });
}

export async function makePurpleArea(floorGeo: MoldableCubeGeometry, octree: OctreeNode, heights: number[]) {
    await makeLandscape(floorGeo, 0.15, 1, 8, 0.07, 2, 15, 0.01, 1, 4, .38, .7, 0.47,
        (vert, broad, mountain, mountainAmount) => {
            vert.y = broad * 40 + mountainAmount * mountain * 80;
            heights.push(vert.y);
            updateMinMax(vert.y, octree);

            if (mountainAmount > 0.1 && Math.abs(vert.x) < 140 && Math.abs(vert.z) < 145) {
                const scale = new DOMMatrix().rotateSelf(0, 0, vert.y * 0.6 * Math.sign(vert.x) * mountainAmount);
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
