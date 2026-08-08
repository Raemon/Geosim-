import { rockyPlanetFrom, type RockyPlanet } from '../src/planet/planetBody';
import { formSystem } from '../src/sim/formSystem';
import { newPlanetSurface } from '../src/sim/newPlanetSurface';
import { stepPlanet, type PlanetSurface } from '../src/sim/stepPlanet';
import { MAX_NEIGHBOURS, sphereGrid } from '../src/sphere/sphereGrid';
import { CONVERGENT, DIVERGENT, INTERIOR, classifyBoundaries } from '../src/tectonics/boundaryClassification';
import { isContinental } from '../src/tectonics/crustState';
import { airyHeightM } from '../src/tectonics/isostasy';
import { speedCmPerYear, plateVelocityMPerMyr } from '../src/tectonics/plateVelocity';
import { oceanAreaFraction, seaLevelForWaterVolume } from '../src/tectonics/seaLevel';
import { thermalSubsidenceM } from '../src/tectonics/thermalSubsidence';
import { EARTH_MASS_KG } from '../src/units/constants';
import { checksNamed, isWithinFraction } from './checkReporter';

const SUBDIVISIONS = 4;
const STEPS_TO_FOUR_BILLION_YEARS = 800;

checksNamed('sphere topology', (check) => {
  const grid = sphereGrid(SUBDIVISIONS);
  check('cell count matches the subdivided icosahedron', grid.cellCount === 10 * 4 ** SUBDIVISIONS + 2);

  let pentagons = 0;
  let symmetric = true;
  for (let cell = 0; cell < grid.cellCount; cell++) {
    const count = grid.neighbourCount[cell]!;
    if (count === 5) pentagons++;
    if (count !== 5 && count !== 6) symmetric = false;
    for (const other of neighboursOf(grid, cell)) {
      if (!neighboursOf(grid, other).includes(cell)) symmetric = false;
    }
  }
  check('every cell has five or six neighbours and adjacency is symmetric', symmetric);
  check('exactly twelve cells are pentagons, as on any goldberg sphere', pentagons === 12);

  let area = 0;
  for (let cell = 0; cell < grid.cellCount; cell++) area += grid.areaFraction[cell]!;
  check('cell areas partition the sphere exactly once', isWithinFraction(area, 1, 1e-9));
  check(
    'no cell has zero or negative area',
    grid.areaFraction.every((fraction) => fraction > 0),
  );
});

checksNamed('plates and boundaries', (check) => {
  const surface = youngSurface();
  const velocity = plateVelocityMPerMyr(
    surface.grid,
    surface.plateOf,
    surface.poles,
    surface.planetRadiusM,
  );
  const boundaries = classifyBoundaries(surface.grid, surface.plateOf, velocity);

  check(
    'plate speeds land in the centimetres per year range plates actually move at',
    everyCell(surface, (cell) => speedCmPerYear(velocity, cell) < 20),
  );
  check(
    'some cell moves at least a centimetre a year',
    anyCell(surface, (cell) => speedCmPerYear(velocity, cell) > 1),
  );
  check(
    'a cell is interior exactly when all its neighbours share its plate',
    everyCell(surface, (cell) => (boundaries.kind[cell] === INTERIOR)
      === neighboursOf(surface.grid, cell).every((other) => surface.plateOf[other] === surface.plateOf[cell])),
  );
  check(
    'the boundary network carries both convergent and divergent segments',
    anyCell(surface, (cell) => boundaries.kind[cell] === CONVERGENT)
      && anyCell(surface, (cell) => boundaries.kind[cell] === DIVERGENT),
  );
});

checksNamed('isostasy and thermal subsidence', (check) => {
  check(
    'thicker crust of the same density floats higher',
    airyHeightM(40000, 2800) > airyHeightM(7000, 2800),
  );
  check(
    'lighter crust of the same thickness floats higher',
    airyHeightM(30000, 2700) > airyHeightM(30000, 2950),
  );
  check('fresh ocean floor has not subsided at all', thermalSubsidenceM(0) === 0);
  check(
    'ocean floor deepens as the square root of its age',
    isWithinFraction(thermalSubsidenceM(40) / thermalSubsidenceM(10), 2, 1e-9),
  );
  check(
    'subsidence stops once the plate reaches thermal equilibrium',
    thermalSubsidenceM(200) === thermalSubsidenceM(80),
  );
});

checksNamed('an evolved planet looks like a planet', (check) => {
  const surface = evolvedSurface();
  const continental = continentalAreaFraction(surface);
  check(
    'continental crust ends up covering a third of the planet, as earth does',
    continental > 0.15 && continental < 0.55,
  );
  check(
    'continental crust is both thicker and lighter than ocean floor',
    meanOf(surface, isContinental, (cell) => surface.crust.thicknessM[cell]!)
      > meanOf(surface, (crust, cell) => !isContinental(crust, cell), (cell) => surface.crust.thicknessM[cell]!),
  );
  check(
    'relief spans several kilometres either side of sea level',
    highestElevation(surface) > 2000 && lowestElevation(surface) < -3000,
  );
  check(
    'the elevation histogram is bimodal, which is what two crust densities produce',
    isBimodal(surface),
  );
  check(
    'oceans cover most but not all of the planet',
    oceanAreaFraction(surface.grid, surface.crust, surface.seaLevelM) > 0.4,
  );
});

checksNamed('sea level follows the water inventory', (check) => {
  const surface = evolvedSurface();
  const low = seaLevelForWaterVolume(surface.grid, surface.crust, surface.waterMassKg, surface.planetRadiusM);
  const high = seaLevelForWaterVolume(surface.grid, surface.crust, surface.waterMassKg * 4, surface.planetRadiusM);
  check('four times the water stands higher', high > low);
  check(
    'four times the water drowns more of the planet',
    oceanAreaFraction(surface.grid, surface.crust, high)
      > oceanAreaFraction(surface.grid, surface.crust, low),
  );
  check(
    'a planet with no water has no ocean',
    oceanAreaFraction(surface.grid, surface.crust,
      seaLevelForWaterVolume(surface.grid, surface.crust, 0, surface.planetRadiusM)) < 0.001,
  );
});

checksNamed('surface evolution is deterministic', (check) => {
  const first = steppedSurface(40);
  const again = steppedSurface(40);
  check(
    'the same seed gives bit identical elevations after forty steps',
    first.crust.elevationM.every((value, cell) => value === again.crust.elevationM[cell]),
  );
  check(
    'cell areas are untouched by evolution',
    isWithinFraction(first.grid.areaFraction.reduce((sum, value) => sum + value, 0), 1, 1e-9),
  );
});

let cachedEvolved: PlanetSurface | undefined;

function evolvedSurface(): PlanetSurface {
  cachedEvolved ??= steppedSurface(STEPS_TO_FOUR_BILLION_YEARS);
  return cachedEvolved;
}

function steppedSurface(steps: number): PlanetSurface {
  let surface = youngSurface();
  for (let step = 0; step < steps; step++) surface = stepPlanet(surface);
  return surface;
}

function youngSurface(): PlanetSurface {
  return newPlanetSurface(wateredEarthMassPlanet(), 1, SUBDIVISIONS);
}

function wateredEarthMassPlanet(): RockyPlanet {
  const candidates = [1, 2, 3, 7, 11, 19, 23, 31].flatMap((seed) => {
    const system = formSystem(seed);
    return system.planets
      .filter((planet) => planet.kind === 'rocky' && planet.semiMajorAxisAu < system.snowLineAu)
      .map(rockyPlanetFrom)
      .filter((planet) => planet.volatiles.waterMassKg > 0);
  });
  return candidates.sort(
    (a, b) => Math.abs(a.massKg - EARTH_MASS_KG) - Math.abs(b.massKg - EARTH_MASS_KG),
  )[0]!;
}

function neighboursOf(grid: { neighbours: Int32Array; neighbourCount: Int32Array }, cell: number): number[] {
  const found: number[] = [];
  for (let slot = 0; slot < grid.neighbourCount[cell]!; slot++) {
    found.push(grid.neighbours[cell * MAX_NEIGHBOURS + slot]!);
  }
  return found;
}

function everyCell(surface: PlanetSurface, holds: (cell: number) => boolean): boolean {
  for (let cell = 0; cell < surface.grid.cellCount; cell++) if (!holds(cell)) return false;
  return true;
}

function anyCell(surface: PlanetSurface, holds: (cell: number) => boolean): boolean {
  for (let cell = 0; cell < surface.grid.cellCount; cell++) if (holds(cell)) return true;
  return false;
}

function continentalAreaFraction(surface: PlanetSurface): number {
  let area = 0;
  for (let cell = 0; cell < surface.grid.cellCount; cell++) {
    if (isContinental(surface.crust, cell)) area += surface.grid.areaFraction[cell]!;
  }
  return area;
}

function meanOf(
  surface: PlanetSurface,
  include: (crust: PlanetSurface['crust'], cell: number) => boolean,
  valueAt: (cell: number) => number,
): number {
  let total = 0;
  let weight = 0;
  for (let cell = 0; cell < surface.grid.cellCount; cell++) {
    if (!include(surface.crust, cell)) continue;
    total += valueAt(cell) * surface.grid.areaFraction[cell]!;
    weight += surface.grid.areaFraction[cell]!;
  }
  return weight > 0 ? total / weight : 0;
}

function highestElevation(surface: PlanetSurface): number {
  return surface.crust.elevationM.reduce((best, value) => Math.max(best, value), -Infinity);
}

function lowestElevation(surface: PlanetSurface): number {
  return surface.crust.elevationM.reduce((best, value) => Math.min(best, value), Infinity);
}

const HISTOGRAM_BINS = 32;

function isBimodal(surface: PlanetSurface): boolean {
  const histogram = elevationHistogram(surface);
  const peaks = peakBins(histogram);
  if (peaks.length < 2) return false;
  const [first, second] = [peaks[0]!, peaks[peaks.length - 1]!];
  const trough = Math.min(...histogram.slice(Math.min(first, second) + 1, Math.max(first, second)));
  return trough < 0.5 * Math.min(histogram[first]!, histogram[second]!);
}

function elevationHistogram(surface: PlanetSurface): number[] {
  const low = lowestElevation(surface);
  const span = highestElevation(surface) - low || 1;
  const histogram = new Array<number>(HISTOGRAM_BINS).fill(0);
  for (let cell = 0; cell < surface.grid.cellCount; cell++) {
    const bin = Math.min(
      HISTOGRAM_BINS - 1,
      Math.floor(((surface.crust.elevationM[cell]! - low) / span) * HISTOGRAM_BINS),
    );
    histogram[bin]! += surface.grid.areaFraction[cell]!;
  }
  return histogram;
}

function peakBins(histogram: readonly number[]): number[] {
  const peaks: number[] = [];
  for (let bin = 0; bin < histogram.length; bin++) {
    const left = histogram[bin - 1] ?? 0;
    const right = histogram[bin + 1] ?? 0;
    if (histogram[bin]! > left && histogram[bin]! >= right && histogram[bin]! > 0.02) peaks.push(bin);
  }
  return peaks;
}
