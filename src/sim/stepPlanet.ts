import { runSurfaceCycle } from './erodeSurface';
import { accreteAtRidges } from '../tectonics/accreteAtRidges';
import { advectPlates } from '../tectonics/advectPlates';
import { classifyBoundaries } from '../tectonics/boundaryClassification';
import type { CrustState } from '../tectonics/crustState';
import type { EulerPoles } from '../tectonics/eulerPole';
import { applyIsostasy } from '../tectonics/isostasy';
import { plateVelocityMPerMyr } from '../tectonics/plateVelocity';
import { seaLevelForWaterVolume } from '../tectonics/seaLevel';
import { subductAndBuildArcs } from '../tectonics/subductAndArc';
import type { SphereGrid } from '../sphere/sphereGrid';
import { meanCellSpacingM } from '../sphere/cellSpacing';
import { streamFor } from '../random/mulberry32';
import { assignPlates } from '../tectonics/plateSeeds';
import { randomEulerPoles } from '../tectonics/eulerPole';

export interface PlanetSurface {
  seed: number;
  grid: SphereGrid;
  crust: CrustState;
  plateOf: Int32Array;
  poles: EulerPoles;
  pendingRotationRad: Float64Array;
  planetRadiusM: number;
  waterMassKg: number;
  carbonDioxideMassKg: number;
  luminositySolar: number;
  semiMajorAxisAu: number;
  surfaceGravityMS2: number;
  mantleVigourAt: (ageMyr: number) => number;
  ageMyr: number;
  seaLevelM: number;
}

export const STEP_MYR = 5;
export const PLATE_REORGANISATION_INTERVAL_MYR = 400;

export function stepPlanet(surface: PlanetSurface): PlanetSurface {
  const moved = advectPlates(
    surface.grid, surface.crust, surface.plateOf, surface.poles, surface.pendingRotationRad, STEP_MYR,
  );
  const next: PlanetSurface = { ...surface, crust: moved };
  reworkCrustAtBoundaries(next);
  ageCrust(next);
  const aged = surface.ageMyr + STEP_MYR;
  const standing = withElevationAndSeaLevel(next, aged);
  const cycled = runSurfaceCycle(standing, STEP_MYR);
  const weathered = { ...standing, carbonDioxideMassKg: cycled.carbonDioxideMassKg };
  return withElevationAndSeaLevel(reorganisedIfDue(weathered, aged), aged);
}

function reorganisedIfDue(surface: PlanetSurface, ageMyr: number): PlanetSurface {
  if (ageMyr % PLATE_REORGANISATION_INTERVAL_MYR !== 0) return surface;
  const random = streamFor(surface.seed, `plate reorganisation ${ageMyr}`);
  const plateCount = surface.poles.angularSpeedRadPerMyr.length;
  return {
    ...surface,
    plateOf: assignPlates(surface.grid, plateCount, random),
    poles: randomEulerPoles(plateCount, random),
    pendingRotationRad: new Float64Array(plateCount),
  };
}

function reworkCrustAtBoundaries(surface: PlanetSurface): void {
  const velocity = plateVelocityMPerMyr(
    surface.grid,
    surface.plateOf,
    surface.poles,
    surface.planetRadiusM,
  );
  const boundaries = classifyBoundaries(surface.grid, surface.plateOf, velocity);
  const spacing = meanCellSpacingM(surface.grid, surface.planetRadiusM);
  accreteAtRidges(surface.grid, surface.crust, boundaries, STEP_MYR, spacing);
  subductAndBuildArcs(
    surface.grid,
    surface.crust,
    boundaries,
    surface.plateOf,
    STEP_MYR,
    surface.mantleVigourAt(surface.ageMyr),
    spacing,
  );
}

function ageCrust(surface: PlanetSurface): void {
  for (let cell = 0; cell < surface.grid.cellCount; cell++) {
    surface.crust.ageMyr[cell] = surface.crust.ageMyr[cell]! + STEP_MYR;
  }
}

function withElevationAndSeaLevel(surface: PlanetSurface, ageMyr: number): PlanetSurface {
  applyIsostasy(surface.grid, surface.crust);
  return {
    ...surface,
    ageMyr,
    seaLevelM: seaLevelForWaterVolume(
      surface.grid,
      surface.crust,
      surface.waterMassKg,
      surface.planetRadiusM,
    ),
  };
}
