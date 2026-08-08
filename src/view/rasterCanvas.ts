import type { RasterImage } from './equirectangularMap';

export function drawRasterImageStretched(
  context: CanvasRenderingContext2D,
  image: RasterImage,
): void {
  const source = document.createElement('canvas');
  source.width = image.width;
  source.height = image.height;
  const sourceContext = source.getContext('2d');
  if (sourceContext === null) return;
  sourceContext.putImageData(opaqueImageData(image), 0, 0);
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.drawImage(source, 0, 0, context.canvas.width, context.canvas.height);
}

function opaqueImageData(image: RasterImage): ImageData {
  const data = new Uint8ClampedArray(image.width * image.height * 4);
  for (let pixel = 0; pixel < image.width * image.height; pixel++) {
    data[pixel * 4] = image.pixels[pixel * 3]!;
    data[pixel * 4 + 1] = image.pixels[pixel * 3 + 1]!;
    data[pixel * 4 + 2] = image.pixels[pixel * 3 + 2]!;
    data[pixel * 4 + 3] = 255;
  }
  return new ImageData(data, image.width, image.height);
}
