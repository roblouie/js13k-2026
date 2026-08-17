import {smoothstep} from "@/engine/helpers";

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

export async function toHeightmap(svgString: string, size = 512): Promise<number[]> {
  const imageData = await toImageData(svgString, size);
  const map: number[] = [];
  for (let i = 0; i < imageData.data.length; i+= 4) {
    const value = (imageData.data[i + 1] / 255 - 0.4) * 2;
    const hills = value
    const mountains = Math.pow((1 - Math.abs(value)), 2);
    const mountainAmount = smoothstep(0.6, 0.8, imageData.data[i] / 255);

    map.push(hills * .25 + mountains * mountainAmount * 3);
    //map.push(0)
  }
  return map;
}
