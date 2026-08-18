import {smoothstep} from "@/engine/helpers";
import {MoldableCubeGeometry} from "@/engine/moldable-cube-geometry";
import {AttributeLocation} from "@/engine/renderer/renderer";
import {OctreeNode} from "@/engine/physics/octree";

export async function toImage(svgImageBuilder: string, widthOrSize = 512, height?: number): Promise<HTMLImageElement> {
  const image_ = new Image();
  image_.src = URL.createObjectURL(new Blob([`<svg width="${widthOrSize}" height="${height ?? widthOrSize}" xmlns="http://www.w3.org/2000/svg">${svgImageBuilder}</svg>`], { type: 'image/svg+xml' }));
  return new Promise(resolve => image_.addEventListener('load', () => resolve(image_)));
}

export async function toImageData(svgString: string, widthOrSize = 512): Promise<ImageData> {
  const image_ = await toImage(svgString, widthOrSize);
  const canvas = new OffscreenCanvas(image_.width, image_.height);
  const context = canvas.getContext('2d')!;
  // @ts-ignore
  context.drawImage(image_, 0, 0);
  // @ts-ignore
  return context.getImageData(0, 0, image_.width, image_.height);
}

export function smoothstep(rangeState: number, rangeEnd: number, x: number): number {
  x = Math.max(0, Math.min(1, (x-rangeState)/(rangeEnd-rangeState)));
  return x*x*(3-2*x);
}

function baseHeightmapData(_baseFrequency: number, _numOctaves: number, _seed: number, size: number, _type: 'fractalNoise' | 'turbulence' = 'fractalNoise') {
  return toImageData(`<filter id="n" >
    <feTurbulence type="${_type}" baseFrequency="${_baseFrequency}" numOctaves="${_numOctaves}" seed="${_seed}" result="n"/>
    <feColorMatrix in="n" type="matrix" values="
      1 0 0 0 0
      0 0 0 0 0
      0 0 0 0 0
      0 0 0 1 0"/>
  </filter>
  <rect width="${size}" height="${size}" filter="url(#n)"/>`, size);
}

export async function makeGrassMountainRegion(floorGeo: MoldableCubeGeometry, octreeNode: OctreeNode) {


  const broadImageData = await baseHeightmapData(0.03, 2, 1, 64);
  const mountainLocationData = await baseHeightmapData(0.03, 2, 5, 64);
  const fineImageData = await baseHeightmapData(0.2, 2, 1, 64);

  const meshTextureDepthData = floorGeo.getAttribute_(AttributeLocation.TextureDepth).data;

  for (let i = 0; i < broadImageData.data.length; i += 4) {
    const region = (mountainLocationData.data[i] / 255) * (mountainLocationData.data[i + 3] / 255);
    const broad = broadImageData.data[i] / 255;
    const mountain = fineImageData.data[i] / 255;

    const mountainAmount = smoothstep(.4, .7, region);

    meshTextureDepthData[i / 4] += mountainAmount + 0.49;

    // let ridge = 1 - Math.abs(2 * mountain - 1);
    // ridge *= ridge;
    // ridge = Math.max(0, ridge) / 2;

    const value = broad * 70
        + mountainAmount * mountain * 380;

    floorGeo.vertices[i / 4].y = value;
    updateMinMax(value, octreeNode);

    // Add snow to mountains
    // if (value > 220) {
    //   meshTextureDepthData[i / 4] += 1;
    // }

  }
}

function updateMinMax(value: number, octreeNode: OctreeNode): void {
  if (value < octreeNode.bounds.min.y) {
    octreeNode.bounds.min.y = value;
  } else if (value > octreeNode.bounds.max.y) {
    octreeNode.bounds.max.y = value;
  }
}
