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

export async function toHeightmap(svgString: string, size = 512, scale: number): Promise<number[]> {
  const imageData = await toImageData(svgString, size);
  const map = [];
  for (let i = 0; i < imageData.data.length; i+= 4) {
    map.push((imageData.data[i] / 255 - 0.5) * scale);
    //map.push(0)
  }
  return map;
}
