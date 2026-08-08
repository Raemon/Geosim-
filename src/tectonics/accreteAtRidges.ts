import { blendedToward, fractionOfCellReworked } from '../sphere/cellSpacing';
import type { SphereGrid } from '../sphere/sphereGrid';
import {
  CONTINENTAL_DENSITY_THRESHOLD,
  OCEANIC_CRUST_DENSITY,
  OCEANIC_CRUST_THICKNESS_M,
  type CrustState,
} from './crustState';
import { DIVERGENT, type PlateBoundaries } from './boundaryClassification';

export function accreteAtRidges(
  grid: SphereGrid,
  crust: CrustState,
  boundaries: PlateBoundaries,
  stepMyr: number,
  cellSpacingM: number,
): void {
  for (let cell = 0; cell < grid.cellCount; cell++) {
    if (boundaries.kind[cell] !== DIVERGENT || riftedContinent(crust, cell)) continue;
    layFreshBasalt(crust, cell, fractionOfCellReworked(
      boundaries.closingRateMPerMyr[cell]!, stepMyr, cellSpacingM,
    ));
  }
}

function riftedContinent(crust: CrustState, cell: number): boolean {
  return crust.densityKgM3[cell]! < CONTINENTAL_DENSITY_THRESHOLD;
}

function layFreshBasalt(crust: CrustState, cell: number, reworked: number): void {
  crust.thicknessM[cell] = blendedToward(crust.thicknessM[cell]!, OCEANIC_CRUST_THICKNESS_M, reworked);
  crust.densityKgM3[cell] = blendedToward(crust.densityKgM3[cell]!, OCEANIC_CRUST_DENSITY, reworked);
  crust.ageMyr[cell] = blendedToward(crust.ageMyr[cell]!, 0, reworked);
}
