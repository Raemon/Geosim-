import type { SphereGrid } from '../sphere/sphereGrid';
import { isContinental, OCEANIC_CRUST_THICKNESS_M, type CrustState } from './crustState';
import { thermalSubsidenceM } from './thermalSubsidence';

export const MANTLE_DENSITY_KG_M3 = 3300;

const RIDGE_CREST_DEPTH_M = 2600;

export function applyIsostasy(grid: SphereGrid, crust: CrustState): void {
  const datum = airyHeightM(OCEANIC_CRUST_THICKNESS_M, crust.densityKgM3[0] ?? 2900)
    + RIDGE_CREST_DEPTH_M;
  for (let cell = 0; cell < grid.cellCount; cell++) {
    crust.elevationM[cell] = elevationOfCell(crust, cell, datum);
  }
}

function elevationOfCell(crust: CrustState, cell: number, datum: number): number {
  const floating = airyHeightM(crust.thicknessM[cell]!, crust.densityKgM3[cell]!) - datum;
  if (isContinental(crust, cell)) return floating;
  return floating - thermalSubsidenceM(crust.ageMyr[cell]!);
}

export function airyHeightM(thicknessM: number, densityKgM3: number): number {
  return thicknessM * (1 - densityKgM3 / MANTLE_DENSITY_KG_M3);
}
