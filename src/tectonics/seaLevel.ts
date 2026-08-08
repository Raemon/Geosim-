import type { SphereGrid } from '../sphere/sphereGrid';
import type { CrustState } from './crustState';

const BISECTION_STEPS = 80;
const WATER_DENSITY_KG_M3 = 1000;

export function seaLevelForWaterVolume(
  grid: SphereGrid,
  crust: CrustState,
  waterMassKg: number,
  planetRadiusM: number,
): number {
  const targetVolumeM3 = waterMassKg / WATER_DENSITY_KG_M3;
  const surfaceAreaM2 = 4 * Math.PI * planetRadiusM * planetRadiusM;
  let low = lowestElevation(grid, crust);
  let high = highestElevation(grid, crust);
  for (let step = 0; step < BISECTION_STEPS; step++) {
    const middle = 0.5 * (low + high);
    if (oceanVolumeM3(grid, crust, middle, surfaceAreaM2) < targetVolumeM3) low = middle;
    else high = middle;
  }
  return low;
}

export function oceanVolumeM3(
  grid: SphereGrid,
  crust: CrustState,
  seaLevelM: number,
  surfaceAreaM2: number,
): number {
  let volume = 0;
  for (let cell = 0; cell < grid.cellCount; cell++) {
    const depth = seaLevelM - crust.elevationM[cell]!;
    if (depth > 0) volume += depth * grid.areaFraction[cell]! * surfaceAreaM2;
  }
  return volume;
}

export function oceanAreaFraction(grid: SphereGrid, crust: CrustState, seaLevelM: number): number {
  let submerged = 0;
  for (let cell = 0; cell < grid.cellCount; cell++) {
    if (crust.elevationM[cell]! < seaLevelM) submerged += grid.areaFraction[cell]!;
  }
  return submerged;
}

function lowestElevation(grid: SphereGrid, crust: CrustState): number {
  let lowest = Infinity;
  for (let cell = 0; cell < grid.cellCount; cell++) lowest = Math.min(lowest, crust.elevationM[cell]!);
  return lowest;
}

function highestElevation(grid: SphereGrid, crust: CrustState): number {
  let highest = -Infinity;
  for (let cell = 0; cell < grid.cellCount; cell++) highest = Math.max(highest, crust.elevationM[cell]!);
  return highest;
}
