import { blendedToward, fractionOfCellReworked } from '../sphere/cellSpacing';
import { MAX_NEIGHBOURS, type SphereGrid } from '../sphere/sphereGrid';
import { CONVERGENT, type PlateBoundaries } from './boundaryClassification';
import {
  CONTINENTAL_CRUST_DENSITY,
  OCEANIC_CRUST_DENSITY,
  OCEANIC_CRUST_THICKNESS_M,
  isContinental,
  type CrustState,
} from './crustState';

const ARC_THICKENING_TARGET_M = 40000;
const FELSIFICATION_EFFICIENCY = 1;

export function subductAndBuildArcs(
  grid: SphereGrid,
  crust: CrustState,
  boundaries: PlateBoundaries,
  plateOf: Int32Array,
  stepMyr: number,
  mantleVigour: number,
  cellSpacingM: number,
): void {
  for (let cell = 0; cell < grid.cellCount; cell++) {
    if (boundaries.kind[cell] !== CONVERGENT) continue;
    const reworked = fractionOfCellReworked(
      boundaries.closingRateMPerMyr[cell]!, stepMyr, cellSpacingM,
    );
    if (subductsBeneathNeighbour(grid, crust, plateOf, cell)) recycleAsFreshOcean(crust, cell, reworked);
    else growArcCrust(crust, cell, reworked * mantleVigour);
  }
}

function subductsBeneathNeighbour(
  grid: SphereGrid,
  crust: CrustState,
  plateOf: Int32Array,
  cell: number,
): boolean {
  if (isContinental(crust, cell)) return false;
  const base = cell * MAX_NEIGHBOURS;
  for (let slot = 0; slot < grid.neighbourCount[cell]!; slot++) {
    const other = grid.neighbours[base + slot]!;
    if (plateOf[other] === plateOf[cell]) continue;
    if (outranksForSubduction(crust, other, cell)) return true;
  }
  return false;
}

function outranksForSubduction(crust: CrustState, overriding: number, subducting: number): boolean {
  if (isContinental(crust, overriding)) return true;
  return crust.ageMyr[subducting]! > crust.ageMyr[overriding]!;
}

function recycleAsFreshOcean(crust: CrustState, cell: number, reworked: number): void {
  crust.thicknessM[cell] = blendedToward(crust.thicknessM[cell]!, OCEANIC_CRUST_THICKNESS_M, reworked);
  crust.densityKgM3[cell] = blendedToward(crust.densityKgM3[cell]!, OCEANIC_CRUST_DENSITY, reworked);
  crust.ageMyr[cell] = blendedToward(crust.ageMyr[cell]!, 0, reworked);
}

function growArcCrust(crust: CrustState, cell: number, reworked: number): void {
  crust.thicknessM[cell] = blendedToward(crust.thicknessM[cell]!, ARC_THICKENING_TARGET_M, reworked);
  crust.densityKgM3[cell] = blendedToward(
    crust.densityKgM3[cell]!,
    CONTINENTAL_CRUST_DENSITY,
    Math.min(1, reworked * FELSIFICATION_EFFICIENCY),
  );
}
