import { MAX_NEIGHBOURS, type SphereGrid } from '../sphere/sphereGrid';
import type { SurfaceVelocity } from './plateVelocity';

export const INTERIOR = 0;
export const CONVERGENT = 1;
export const DIVERGENT = 2;
export const TRANSFORM = 3;

export interface PlateBoundaries {
  kind: Int32Array;
  closingRateMPerMyr: Float64Array;
}

const TRANSFORM_RATE_THRESHOLD_M_PER_MYR = 300;

export function classifyBoundaries(
  grid: SphereGrid,
  plateOf: Int32Array,
  velocity: SurfaceVelocity,
): PlateBoundaries {
  const boundaries: PlateBoundaries = {
    kind: new Int32Array(grid.cellCount),
    closingRateMPerMyr: new Float64Array(grid.cellCount),
  };
  for (let cell = 0; cell < grid.cellCount; cell++) {
    fillCellBoundary(boundaries, grid, plateOf, velocity, cell);
  }
  return boundaries;
}

function fillCellBoundary(
  boundaries: PlateBoundaries,
  grid: SphereGrid,
  plateOf: Int32Array,
  velocity: SurfaceVelocity,
  cell: number,
): void {
  const strongest = strongestNeighbourRate(grid, plateOf, velocity, cell);
  boundaries.closingRateMPerMyr[cell] = strongest;
  boundaries.kind[cell] = kindOfRate(strongest, hasForeignNeighbour(grid, plateOf, cell));
}

function kindOfRate(closingRate: number, onBoundary: boolean): number {
  if (!onBoundary) return INTERIOR;
  if (closingRate > TRANSFORM_RATE_THRESHOLD_M_PER_MYR) return CONVERGENT;
  if (closingRate < -TRANSFORM_RATE_THRESHOLD_M_PER_MYR) return DIVERGENT;
  return TRANSFORM;
}

function hasForeignNeighbour(grid: SphereGrid, plateOf: Int32Array, cell: number): boolean {
  const base = cell * MAX_NEIGHBOURS;
  for (let slot = 0; slot < grid.neighbourCount[cell]!; slot++) {
    if (plateOf[grid.neighbours[base + slot]!] !== plateOf[cell]) return true;
  }
  return false;
}

function strongestNeighbourRate(
  grid: SphereGrid,
  plateOf: Int32Array,
  velocity: SurfaceVelocity,
  cell: number,
): number {
  const base = cell * MAX_NEIGHBOURS;
  let strongest = 0;
  for (let slot = 0; slot < grid.neighbourCount[cell]!; slot++) {
    const other = grid.neighbours[base + slot]!;
    if (plateOf[other] === plateOf[cell]) continue;
    const rate = closingRateBetween(grid, velocity, cell, other);
    if (Math.abs(rate) > Math.abs(strongest)) strongest = rate;
  }
  return strongest;
}

function closingRateBetween(
  grid: SphereGrid,
  velocity: SurfaceVelocity,
  cell: number,
  other: number,
): number {
  const dx = grid.positionX[other]! - grid.positionX[cell]!;
  const dy = grid.positionY[other]! - grid.positionY[cell]!;
  const dz = grid.positionZ[other]! - grid.positionZ[cell]!;
  const length = Math.hypot(dx, dy, dz) || 1;
  const relativeX = velocity.eastX[cell]! - velocity.eastX[other]!;
  const relativeY = velocity.eastY[cell]! - velocity.eastY[other]!;
  const relativeZ = velocity.eastZ[cell]! - velocity.eastZ[other]!;
  return (relativeX * dx + relativeY * dy + relativeZ * dz) / length;
}
