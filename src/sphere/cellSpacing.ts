import type { SphereGrid } from './sphereGrid';

export function meanCellSpacingM(grid: SphereGrid, planetRadiusM: number): number {
  return planetRadiusM * Math.sqrt((4 * Math.PI) / grid.cellCount);
}

export function fractionOfCellReworked(
  closingRateMPerMyr: number,
  stepMyr: number,
  cellSpacingM: number,
): number {
  return Math.min(1, (Math.abs(closingRateMPerMyr) * stepMyr) / cellSpacingM);
}

export function blendedToward(current: number, target: number, fraction: number): number {
  return current + (target - current) * fraction;
}
