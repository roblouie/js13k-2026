import { MoldableCubeGeometry } from '@/engine/moldable-cube-geometry';
import { AttributeLocation } from '@/engine/renderer/renderer';
import { EnhancedDOMPoint } from '@/engine/enhanced-dom-point';
import {lerp, smoothstep} from "@/engine/helpers";
import {OctreeNode} from "@/engine/physics/octree";
import {toImageData} from "@/engine/svg-maker/svg-string-converters";
import {colorMatrix, noise, svgFilter, svgGradient} from "@/textures";

// dumb but small
let areasCreated = 0;

function baseHeightmapData(_baseFrequency: number, _numOctaves: number, _seed: number, size: number, cutoff: string, sideCutoff: string) {
    const verticalStops = (takeSide: boolean): [number, string, number] => ([[.1, takeSide ? sideCutoff : cutoff, 1], [.4, takeSide ? sideCutoff : cutoff, 0]]);
    const horizontalStops = [[.1, sideCutoff, 1], [.4, sideCutoff, 0]];
    return toImageData(`${svgFilter(noise(_baseFrequency, _numOctaves, _seed, true, false) + colorMatrix([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0])) + svgGradient(verticalStops(areasCreated === 0)) + svgGradient(verticalStops(areasCreated === 4), 0, 0, 1, 0, 'g2') + svgGradient(horizontalStops, 0, 1, 0, 0, 'g3') + svgGradient(horizontalStops, 1, 0, 0, 0, 'g4')}<rect width="${size}" height="${size}" filter="url(#f)"/><rect width="${size}" height="7" fill="url(#g)" /><rect y="${size - 7}" width="${size}" height="7" fill="url(#g2)"/><rect height="${size}" width="7" fill="url(#g3)" /><rect height="${size}" width="7" x="${size - 7}" fill="url(#g4)" />`, size);
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

export async function makeRedArea(floorGeo: MoldableCubeGeometry, heights: number[]) {
    await makeLandscape(floorGeo, 0.01, 2, 4, 0.035, 2, 34, 0, 1, 1, .39, .5, 0.47,
        (vert, broad, mountain, mountainAmount) => {
            let value = broad * 40 + mountainAmount * mountain * 70;

            vert.y = value;

            if (vert.y > 80) {
                const scale = new DOMMatrix().scaleSelf(1.05, 1, 1.05);
                vert.set(scale.transformPoint(vert));
            }

            heights.push(vert.y);
        });
}

export async function makeGreenArea(floorGeo: MoldableCubeGeometry, heights: number[]) {
    await makeLandscape(floorGeo, 0.03, 2, 4, 0.039, 3, 33, 0.05, 1, 3,0.44, 0.65, 0.49,
    (vert, broad, mountain, mountainAmount) => {
        vert.y =  broad * 40 + mountainAmount * mountain * 65;
        heights.push(vert.y);
    });
}

export async function makeYellowArea(floorGeo: MoldableCubeGeometry, heights: number[]) {
    await makeLandscape(floorGeo, 0.04, 1, 5, 0.1, 3, 4, 0, 1, 1, 0.42, 0.55, 0.46,
    (vert, broad, mountain, mountainAmount) => {
        vert.y = (broad * 120 - 64) + mountainAmount * mountain * 60;

    if (vert.y > 45) {
        vert.y = 50;
    }
        heights.push(vert.y);
    });
}

export async function makeBlueArea(floorGeo: MoldableCubeGeometry, heights: number[]) {
    await makeLandscape(floorGeo,.1, 1, 4, 0.05, 2, 10, 0.09, 2, 4, 0.3, 0.7, 0.45,
        (vert, broad, mountain, mountainAmount, textureDepths, vertIndex) => {
            vert.y = broad * 40 + mountainAmount * mountain * 120;
            heights.push(vert.y);

            // region > 0.5
            // floorGeo.vertices[i / 4].y > 80
            if (mountainAmount * mountain > .25) {
                textureDepths[vertIndex] += mountain * 0.8;
            }
        });
}

export async function makePurpleArea(floorGeo: MoldableCubeGeometry, heights: number[]) {
    await makeLandscape(floorGeo, 0.15, 1, 8, 0.07, 2, 15, 0.01, 1, 4, .38, .7, 0.47,
        (vert, broad, mountain, mountainAmount) => {
            vert.y = broad * 40 + mountainAmount * mountain * 80;
            heights.push(vert.y);

            if (mountainAmount > 0.1 && Math.abs(vert.x) < 140 && Math.abs(vert.z) < 145) {
                const scale = new DOMMatrix().rotateSelf(0, 0, vert.y * 0.6 * Math.sign(vert.x) * mountainAmount);
                vert.set(scale.transformPoint(vert));
            }
        });
}
