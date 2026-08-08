import type { RockyPlanet } from '../planet/planetBody';
import { streamFor } from '../random/mulberry32';
import { sphereGrid } from '../sphere/sphereGrid';
import { randomEulerPoles } from '../tectonics/eulerPole';
import { freshBasalticCrust } from '../tectonics/crustState';
import { applyIsostasy } from '../tectonics/isostasy';
import { assignPlates } from '../tectonics/plateSeeds';
import { seaLevelForWaterVolume } from '../tectonics/seaLevel';
import type { PlanetSurface } from './stepPlanet';

const PLATE_COUNT_RANGE = [10, 22] as const;

export function newPlanetSurface(
  planet: RockyPlanet,
  seed: number,
  subdivisions: number,
): PlanetSurface {
  const random = streamFor(seed, 'plates');
  const grid = sphereGrid(subdivisions);
  const plateCount = Math.round(random.between(...PLATE_COUNT_RANGE));
  const crust = freshBasalticCrust(grid);
  applyIsostasy(grid, crust);
  return {
    seed,
    grid,
    crust,
    plateOf: assignPlates(grid, plateCount, random),
    poles: randomEulerPoles(plateCount, random),
    planetRadiusM: planet.radiusM,
    waterMassKg: planet.volatiles.waterMassKg,
    mantleVigourAt: (ageMyr) => planet.radiogenicHeatWattsAt(ageMyr) / planet.radiogenicHeatWattsAt(0),
    ageMyr: 0,
    seaLevelM: seaLevelForWaterVolume(grid, crust, planet.volatiles.waterMassKg, planet.radiusM),
  };
}
