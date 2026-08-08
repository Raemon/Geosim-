import type { SphereGrid } from '../sphere/sphereGrid';

export interface CrustState {
  thicknessM: Float64Array;
  densityKgM3: Float64Array;
  ageMyr: Float64Array;
  elevationM: Float64Array;
}

export const OCEANIC_CRUST_THICKNESS_M = 7000;
export const OCEANIC_CRUST_DENSITY = 2900;
export const CONTINENTAL_CRUST_DENSITY = 2835;
export const CONTINENTAL_DENSITY_THRESHOLD = 2865;

export function freshBasalticCrust(grid: SphereGrid): CrustState {
  return {
    thicknessM: new Float64Array(grid.cellCount).fill(OCEANIC_CRUST_THICKNESS_M),
    densityKgM3: new Float64Array(grid.cellCount).fill(OCEANIC_CRUST_DENSITY),
    ageMyr: new Float64Array(grid.cellCount),
    elevationM: new Float64Array(grid.cellCount),
  };
}

export function isContinental(crust: CrustState, cell: number): boolean {
  return crust.densityKgM3[cell]! < CONTINENTAL_DENSITY_THRESHOLD;
}
