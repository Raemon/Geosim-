import type { SphereGrid } from '../sphere/sphereGrid';
import { CONTINENTAL_DENSITY_THRESHOLD, OCEANIC_CRUST_DENSITY, OCEANIC_CRUST_THICKNESS_M, type CrustState } from './crustState';
import { DIVERGENT, type PlateBoundaries } from './boundaryClassification';

export function accreteAtRidges(
  grid: SphereGrid,
  crust: CrustState,
  boundaries: PlateBoundaries,
): void {
  for (let cell = 0; cell < grid.cellCount; cell++) {
    if (boundaries.kind[cell] === DIVERGENT && !riftedContinent(crust, cell)) {
      resetToFreshBasalt(crust, cell);
    }
  }
}

function riftedContinent(crust: CrustState, cell: number): boolean {
  return crust.densityKgM3[cell]! < CONTINENTAL_DENSITY_THRESHOLD;
}

function resetToFreshBasalt(crust: CrustState, cell: number): void {
  crust.thicknessM[cell] = OCEANIC_CRUST_THICKNESS_M;
  crust.densityKgM3[cell] = OCEANIC_CRUST_DENSITY;
  crust.ageMyr[cell] = 0;
}
