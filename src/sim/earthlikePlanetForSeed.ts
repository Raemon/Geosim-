import { rockyPlanetFrom, type RockyPlanet } from '../planet/planetBody';
import { EARTH_MASS_KG } from '../units/constants';
import { formSystem } from './formSystem';

const SYSTEMS_SEARCHED = 40;

export function earthlikePlanetForSeed(seed: number): RockyPlanet {
  const candidates = Array.from({ length: SYSTEMS_SEARCHED }, (_ignored, index) => seed + index)
    .flatMap(wateredRockyPlanetsOf);
  return candidates.sort(
    (a, b) => Math.abs(a.massKg - EARTH_MASS_KG) - Math.abs(b.massKg - EARTH_MASS_KG),
  )[0]!;
}

function wateredRockyPlanetsOf(seed: number): RockyPlanet[] {
  const system = formSystem(seed);
  return system.planets
    .filter((planet) => planet.kind === 'rocky' && planet.semiMajorAxisAu < system.snowLineAu)
    .map(rockyPlanetFrom)
    .filter((planet) => planet.volatiles.waterMassKg > 0);
}
