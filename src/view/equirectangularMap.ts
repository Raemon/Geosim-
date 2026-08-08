import type { SphereGrid } from '../sphere/sphereGrid';
import type { Rgb } from './colorRamps';

export interface RasterImage {
  width: number;
  height: number;
  pixels: Uint8Array;
}

export function equirectangularMap(
  grid: SphereGrid,
  colorOfCell: (cell: number) => Rgb,
  width: number,
): RasterImage {
  const height = Math.round(width / 2);
  const image: RasterImage = { width, height, pixels: new Uint8Array(width * height * 3) };
  const lookup = nearestCellLookup(grid, width, height);
  for (let pixel = 0; pixel < width * height; pixel++) {
    writePixel(image, pixel, colorOfCell(lookup[pixel]!));
  }
  return image;
}

function writePixel(image: RasterImage, pixel: number, color: Rgb): void {
  image.pixels[pixel * 3] = color[0];
  image.pixels[pixel * 3 + 1] = color[1];
  image.pixels[pixel * 3 + 2] = color[2];
}

function nearestCellLookup(grid: SphereGrid, width: number, height: number): Int32Array {
  const lookup = new Int32Array(width * height).fill(-1);
  scatterCellsToPixels(grid, lookup, width, height);
  fillGapsFromNeighbours(lookup, width, height);
  return lookup;
}

function scatterCellsToPixels(
  grid: SphereGrid,
  lookup: Int32Array,
  width: number,
  height: number,
): void {
  for (let cell = 0; cell < grid.cellCount; cell++) {
    const column = Math.min(width - 1, Math.floor(((grid.longitudeRad[cell]! + Math.PI) / (2 * Math.PI)) * width));
    const row = Math.min(height - 1, Math.floor(((Math.PI / 2 - grid.latitudeRad[cell]!) / Math.PI) * height));
    lookup[row * width + column] = cell;
  }
}

function fillGapsFromNeighbours(lookup: Int32Array, width: number, height: number): void {
  const queue = seededPixels(lookup);
  for (let head = 0; head < queue.length; head++) {
    const pixel = queue[head]!;
    for (const next of adjacentPixels(pixel, width, height)) {
      if (lookup[next] !== -1) continue;
      lookup[next] = lookup[pixel]!;
      queue.push(next);
    }
  }
}

function seededPixels(lookup: Int32Array): number[] {
  const seeded: number[] = [];
  for (let pixel = 0; pixel < lookup.length; pixel++) if (lookup[pixel] !== -1) seeded.push(pixel);
  return seeded;
}

function adjacentPixels(pixel: number, width: number, height: number): number[] {
  const row = Math.floor(pixel / width);
  const column = pixel % width;
  const found: number[] = [];
  for (const [rowStep, columnStep] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) {
    const nextRow = row + rowStep;
    if (nextRow < 0 || nextRow >= height) continue;
    found.push(nextRow * width + ((column + columnStep + width) % width));
  }
  return found;
}
