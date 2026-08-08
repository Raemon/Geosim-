import type { RandomStream } from '../random/mulberry32';
import type { SphereGrid } from '../sphere/sphereGrid';

export function assignPlates(
  grid: SphereGrid,
  plateCount: number,
  random: RandomStream,
): Int32Array {
  const seeds = seedCells(grid, plateCount, random);
  const plateOf = new Int32Array(grid.cellCount);
  for (let cell = 0; cell < grid.cellCount; cell++) plateOf[cell] = nearestSeed(grid, seeds, cell);
  return plateOf;
}

function seedCells(grid: SphereGrid, plateCount: number, random: RandomStream): Int32Array {
  const seeds = new Int32Array(plateCount);
  for (let plate = 0; plate < plateCount; plate++) {
    seeds[plate] = Math.min(grid.cellCount - 1, Math.floor(random.next() * grid.cellCount));
  }
  return seeds;
}

function nearestSeed(grid: SphereGrid, seeds: Int32Array, cell: number): number {
  let best = 0;
  let bestDot = -Infinity;
  for (let plate = 0; plate < seeds.length; plate++) {
    const dot = dotBetween(grid, cell, seeds[plate]!);
    if (dot > bestDot) {
      bestDot = dot;
      best = plate;
    }
  }
  return best;
}

function dotBetween(grid: SphereGrid, cell: number, other: number): number {
  return grid.positionX[cell]! * grid.positionX[other]!
    + grid.positionY[cell]! * grid.positionY[other]!
    + grid.positionZ[cell]! * grid.positionZ[other]!;
}
