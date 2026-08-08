import { earthlikePlanetForSeed } from '../src/sim/earthlikePlanetForSeed';
import { newPlanetSurface } from '../src/sim/newPlanetSurface';
import { stepPlanet, type PlanetSurface } from '../src/sim/stepPlanet';
import { isContinental } from '../src/tectonics/crustState';
import { checksNamed } from './checkReporter';

const STEPS = 200;
const COARSE_SUBDIVISIONS = 4;
const FINE_SUBDIVISIONS = 5;
const ALLOWED_CONTINENTAL_SPREAD = 0.12;

checksNamed('the same planet comes out the same at two grid resolutions', (check) => {
  const coarse = evolved(COARSE_SUBDIVISIONS);
  const fine = evolved(FINE_SUBDIVISIONS);
  check(
    'the finer grid resolves at least four times as many cells',
    fine.grid.cellCount > coarse.grid.cellCount * 3.5,
  );
  check(
    'continental area agrees between the two resolutions, which fails whenever a boundary process '
      + 'is written per cell instead of per unit of crust flux',
    Math.abs(continentalFraction(coarse) - continentalFraction(fine)) < ALLOWED_CONTINENTAL_SPREAD,
  );
  check(
    'both resolutions actually build continents rather than agreeing on nothing',
    continentalFraction(coarse) > 0.1 && continentalFraction(fine) > 0.1,
  );
  check(
    'sea level agrees between the two resolutions to within a kilometre',
    Math.abs(coarse.seaLevelM - fine.seaLevelM) < 1000,
  );
});

checksNamed('plates carry crust at a rate the grid cannot change', (check) => {
  const coarse = evolved(COARSE_SUBDIVISIONS);
  const fine = evolved(FINE_SUBDIVISIONS);
  check(
    'mean crust age agrees between resolutions, so slow plates are not frozen by a coarse grid',
    Math.abs(meanCrustAgeMyr(coarse) - meanCrustAgeMyr(fine)) < 200,
  );
});

function evolved(subdivisions: number): PlanetSurface {
  let surface = newPlanetSurface(earthlikePlanetForSeed(1), 1, subdivisions);
  for (let step = 0; step < STEPS; step++) surface = stepPlanet(surface);
  return surface;
}

function continentalFraction(surface: PlanetSurface): number {
  let area = 0;
  for (let cell = 0; cell < surface.grid.cellCount; cell++) {
    if (isContinental(surface.crust, cell)) area += surface.grid.areaFraction[cell]!;
  }
  return area;
}

function meanCrustAgeMyr(surface: PlanetSurface): number {
  let total = 0;
  for (let cell = 0; cell < surface.grid.cellCount; cell++) {
    total += surface.crust.ageMyr[cell]! * surface.grid.areaFraction[cell]!;
  }
  return total;
}
