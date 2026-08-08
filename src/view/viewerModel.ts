import { earthlikePlanetForSeed } from '../sim/earthlikePlanetForSeed';
import { runSurfaceCycle, type SurfaceCycleResult } from '../sim/erodeSurface';
import { newPlanetSurface } from '../sim/newPlanetSurface';
import { stepPlanet, type PlanetSurface } from '../sim/stepPlanet';
import type { RockyPlanet } from '../planet/planetBody';

export interface ViewerModel {
  seed: number;
  subdivisions: number;
  planet: RockyPlanet;
  surface: PlanetSurface;
  climateOfThisStep: SurfaceCycleResult | null;
}

export function newViewerModel(seed: number, subdivisions: number): ViewerModel {
  const planet = earthlikePlanetForSeed(seed);
  return {
    seed,
    subdivisions,
    planet,
    surface: newPlanetSurface(planet, seed, subdivisions),
    climateOfThisStep: null,
  };
}

export function advanceOneStep(model: ViewerModel): void {
  model.surface = stepPlanet(model.surface);
  model.climateOfThisStep = null;
}

export function climateOf(model: ViewerModel): SurfaceCycleResult {
  if (model.climateOfThisStep === null) {
    model.climateOfThisStep = runSurfaceCycle(model.surface, 0);
  }
  return model.climateOfThisStep;
}
