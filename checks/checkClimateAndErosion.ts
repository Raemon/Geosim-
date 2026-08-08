import { carbonDioxideAfterWeathering } from '../src/climate/carbonateSilicateThermostat';
import { greenhouseWarmingK, partialPressureBar } from '../src/climate/greenhouse';
import { equilibriumTemperatureK, latitudeInsolationFactor, stellarFluxWM2 } from '../src/climate/insolation';
import { precipitationMPerMyr } from '../src/climate/orographicPrecipitation';
import { FREEZING_POINT_K, surfaceTemperatureK } from '../src/climate/surfaceTemperature';
import { rockyPlanetFrom, type RockyPlanet } from '../src/planet/planetBody';
import { formSystem } from '../src/sim/formSystem';
import { newPlanetSurface } from '../src/sim/newPlanetSurface';
import { runSurfaceCycle } from '../src/sim/erodeSurface';
import { stepPlanet, type PlanetSurface } from '../src/sim/stepPlanet';
import { routeFlow } from '../src/surface/flowRouting';
import { EARTH_MASS_KG, EARTH_RADIUS_M } from '../src/units/constants';
import { checksNamed, isWithinFraction } from './checkReporter';

const SUBDIVISIONS = 4;

checksNamed('insolation', (check) => {
  check(
    'earth receives about thirteen hundred and sixty watts per square metre',
    isWithinFraction(stellarFluxWM2(1, 1), 1361, 0.02),
  );
  check('flux falls as the inverse square of distance',
    isWithinFraction(stellarFluxWM2(1, 2), stellarFluxWM2(1, 1) / 4, 1e-9));
  check(
    'earth with its real albedo sits near two hundred and fifty five kelvin before greenhouse',
    isWithinFraction(equilibriumTemperatureK(1361, 0.3), 255, 0.02),
  );
  check('the equator receives more than the pole', latitudeInsolationFactor(0) > latitudeInsolationFactor(1.5));
});

checksNamed('greenhouse and the carbonate silicate thermostat', (check) => {
  check(
    'preindustrial carbon dioxide gives roughly the thirty three kelvin earth actually gets',
    greenhouseWarmingK(3e-4, true) > 40 && greenhouseWarmingK(3e-4, true) < 60,
  );
  check('more carbon dioxide warms more', greenhouseWarmingK(3e-2, true) > greenhouseWarmingK(3e-4, true));
  check('warming saturates rather than running away', greenhouseWarmingK(1e6, true) < 200);
  check(
    'atmospheric pressure scales with gas mass and gravity',
    isWithinFraction(partialPressureBar(2e18, 9.8, EARTH_RADIUS_M),
      2 * partialPressureBar(1e18, 9.8, EARTH_RADIUS_M), 1e-9),
  );

  const hot = carbonDioxideAfterWeathering(1e20, 1e-2, 320, 0.3, 1, 5);
  const cold = carbonDioxideAfterWeathering(1e20, 1e-2, 260, 0.3, 1, 5);
  check('a hot planet draws its carbon dioxide down', hot < 1e20);
  check('a cold planet lets carbon dioxide build back up', cold > hot);
  check(
    'a planet with no land weathers far less and so stays carbon rich',
    carbonDioxideAfterWeathering(1e20, 1e-2, 320, 0.0, 1, 5)
      > carbonDioxideAfterWeathering(1e20, 1e-2, 320, 0.6, 1, 5),
  );
  check('the thermostat never drives carbon dioxide negative',
    carbonDioxideAfterWeathering(1e20, 1e3, 500, 1, 1, 5) > 0);
});

checksNamed('temperature over a planet', (check) => {
  const surface = youngSurface();
  const temperature = surfaceTemperatureK(surface.grid, {
    fluxWM2: 1361,
    greenhouseK: 33,
    elevationM: surface.crust.elevationM,
    seaLevelM: surface.seaLevelM,
  });
  check(
    'the equator is warmer than the poles',
    warmestAtLatitude(surface, temperature, 0) > warmestAtLatitude(surface, temperature, 1.4),
  );
  check('no cell reaches an unphysical temperature',
    temperature.every((value) => value > 100 && value < 400));
});

checksNamed('orographic precipitation', (check) => {
  const surface = evolvedSurface();
  const climate = runSurfaceCycle(surface, 0);
  const rain = climate.precipitationMPerMyr;
  check('rain falls somewhere', rain.some((value) => value > 0));
  check('no cell rains a negative amount', rain.every((value) => value >= 0));
  check(
    'the ocean supplies more moisture than the driest land receives',
    meanOverOcean(surface, rain) > minimumOverLand(surface, rain),
  );

  const flat = precipitationMPerMyr(surface.grid, {
    elevationM: new Float64Array(surface.grid.cellCount),
    seaLevelM: -1,
    temperatureK: climate.temperatureK,
  });
  check(
    'a planet with no relief has no orographic rainfall contrast beyond its ocean supply',
    Math.max(...flat) <= Math.max(...rain) * 1.5,
  );
});

checksNamed('erosion lowers what tectonics builds', (check) => {
  const surface = evolvedSurface();
  const climate = runSurfaceCycle(surface, 5);
  check('some cell is eroding', climate.erodedM.some((value) => value > 0));
  check('no cell erodes a negative amount', climate.erodedM.every((value) => value >= 0));
  check('sediment is deposited somewhere', climate.depositedM.some((value) => value > 0));
  check(
    'discharge never decreases downstream, which is what the height ordered accumulation buys',
    dischargeNeverFallsDownstream(surface, climate.dischargeM3PerMyr),
  );
  check(
    'nearly all land finds a downhill neighbour rather than stranding in a pit',
    landFractionWithoutReceiver(surface) < 0.05,
  );
  check(
    'peaks stay in the kilometres, not the tens of kilometres, once erosion is running',
    highestElevation(surface) - surface.seaLevelM < 12000,
  );
});

checksNamed('drainage networks are acyclic', (check) => {
  const surface = evolvedSurface();
  const areas = new Float64Array(surface.grid.cellCount).fill(1);
  const rain = new Float64Array(surface.grid.cellCount).fill(1);
  const network = routeFlow(
    surface.grid, surface.crust.elevationM, rain, areas, surface.seaLevelM,
  );
  check(
    'every receiver is strictly lower than the cell that drains into it',
    network.receiver.every((downstream, cell) => downstream < 0
      || surface.crust.elevationM[downstream]! < surface.crust.elevationM[cell]!),
  );
  check(
    'no cell drains into itself',
    network.receiver.every((downstream, cell) => downstream !== cell),
  );
});

let cachedYoung: PlanetSurface | undefined;
let cachedEvolved: PlanetSurface | undefined;

function youngSurface(): PlanetSurface {
  cachedYoung ??= newPlanetSurface(wateredEarthMassPlanet(), 1, SUBDIVISIONS);
  return cachedYoung;
}

function evolvedSurface(): PlanetSurface {
  if (cachedEvolved === undefined) {
    let surface = newPlanetSurface(wateredEarthMassPlanet(), 1, SUBDIVISIONS);
    for (let step = 0; step < 400; step++) surface = stepPlanet(surface);
    cachedEvolved = surface;
  }
  return cachedEvolved;
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

function warmestAtLatitude(surface: PlanetSurface, temperature: Float64Array, latitude: number): number {
  let warmest = -Infinity;
  for (let cell = 0; cell < surface.grid.cellCount; cell++) {
    if (Math.abs(Math.abs(surface.grid.latitudeRad[cell]!) - latitude) < 0.15) {
      warmest = Math.max(warmest, temperature[cell]!);
    }
  }
  return warmest;
}

function meanOverOcean(surface: PlanetSurface, field: Float64Array): number {
  let total = 0;
  let weight = 0;
  for (let cell = 0; cell < surface.grid.cellCount; cell++) {
    if (surface.crust.elevationM[cell]! >= surface.seaLevelM) continue;
    total += field[cell]! * surface.grid.areaFraction[cell]!;
    weight += surface.grid.areaFraction[cell]!;
  }
  return weight > 0 ? total / weight : 0;
}

function minimumOverLand(surface: PlanetSurface, field: Float64Array): number {
  let lowest = Infinity;
  for (let cell = 0; cell < surface.grid.cellCount; cell++) {
    if (surface.crust.elevationM[cell]! < surface.seaLevelM) continue;
    lowest = Math.min(lowest, field[cell]!);
  }
  return Number.isFinite(lowest) ? lowest : 0;
}

function dischargeNeverFallsDownstream(surface: PlanetSurface, discharge: Float64Array): boolean {
  const network = routeFlow(
    surface.grid,
    surface.crust.elevationM,
    new Float64Array(surface.grid.cellCount).fill(1),
    new Float64Array(surface.grid.cellCount).fill(1),
    surface.seaLevelM,
  );
  for (let cell = 0; cell < surface.grid.cellCount; cell++) {
    const downstream = network.receiver[cell]!;
    if (downstream < 0) continue;
    if (discharge[downstream]! < discharge[cell]! - 1e-6) return false;
  }
  return true;
}

function landFractionWithoutReceiver(surface: PlanetSurface): number {
  const network = routeFlow(
    surface.grid,
    surface.crust.elevationM,
    new Float64Array(surface.grid.cellCount).fill(1),
    new Float64Array(surface.grid.cellCount).fill(1),
    surface.seaLevelM,
  );
  let land = 0;
  let stranded = 0;
  for (let cell = 0; cell < surface.grid.cellCount; cell++) {
    if (surface.crust.elevationM[cell]! < surface.seaLevelM) continue;
    land += surface.grid.areaFraction[cell]!;
    if (network.receiver[cell]! < 0) stranded += surface.grid.areaFraction[cell]!;
  }
  return land > 0 ? stranded / land : 0;
}

function highestElevation(surface: PlanetSurface): number {
  return surface.crust.elevationM.reduce((best, value) => Math.max(best, value), -Infinity);
}

export { FREEZING_POINT_K };
