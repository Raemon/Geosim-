import { seedEmbryos, totalEmbryoMassKg } from '../src/accretion/embryoSeeding';
import { totalPlanetMassKg, type Planet } from '../src/accretion/gasCapture';
import { isolationMassKg } from '../src/accretion/oligarchicGrowth';
import { formSystem, type FormedSystem } from '../src/sim/formSystem';
import { EARTH_MASS_KG, SOLAR_MASS_KG } from '../src/units/constants';
import { checksNamed, isWithinFraction } from './checkReporter';

const SEEDS = [1, 2, 3, 7, 11, 19];
const SYSTEMS = SEEDS.map(formSystem);

checksNamed('oligarchic isolation mass', (check) => {
  const base = isolationMassKg(1, 70, SOLAR_MASS_KG);
  check(
    'the isolation mass at one astronomical unit is a lunar to martian body, not a planet',
    base > 0.005 * EARTH_MASS_KG && base < 0.5 * EARTH_MASS_KG,
  );
  check(
    'isolation mass grows as the three halves power of solid surface density',
    isWithinFraction(isolationMassKg(1, 280, SOLAR_MASS_KG) / base, Math.pow(4, 1.5), 1e-9),
  );
  check('an empty annulus makes no embryo', isolationMassKg(1, 0, SOLAR_MASS_KG) === 0);
});

checksNamed('accretion mass budget', (check) => {
  for (const system of SYSTEMS) {
    const embryos = totalEmbryoMassKg(
      seedEmbryos(system.grid, system.solids, system.star.massSolar * SOLAR_MASS_KG, system.snowLineAu),
    );
    const solids = system.planets.reduce((sum, planet) => sum + planet.massKg, 0);
    check(
      `seed ${system.seed} conserves solid mass across accretion and ejection`,
      isWithinFraction(solids + system.ejectedMassKg, embryos, 1e-9),
    );
  }
});

checksNamed('system architecture', (check) => {
  for (const system of SYSTEMS) {
    check(`seed ${system.seed} makes more than one planet`, system.planets.length > 1);
    check(
      `seed ${system.seed} makes fewer planets than it seeded embryos`,
      system.planets.length < 30,
    );
    check(
      `seed ${system.seed} leaves planets ordered outward`,
      system.planets.every((planet, index) => index === 0
        || planet.semiMajorAxisAu > system.planets[index - 1]!.semiMajorAxisAu),
    );
    check(
      `seed ${system.seed} keeps every gas giant beyond its snow line`,
      system.planets.filter(isGiant).every((planet) => planet.semiMajorAxisAu >= system.snowLineAu),
    );
    check(
      `seed ${system.seed} keeps every rocky planet lighter than a giant`,
      rockyPlanets(system).every((planet) => planet.massKg < 30 * EARTH_MASS_KG),
    );
  }
});

checksNamed('rocky planets carry the water their feeding zone condensed', (check) => {
  for (const system of SYSTEMS) {
    const inner = rockyPlanets(system).filter((planet) => planet.semiMajorAxisAu < system.snowLineAu);
    check(
      `seed ${system.seed} builds rocky planets inside the snow line`,
      inner.length > 0,
    );
    check(
      `seed ${system.seed} never gives a planet inside the snow line any water ice`,
      inner.every((planet) => (planet.species.waterIce ?? 0) === 0),
    );
    check(
      `seed ${system.seed} still hydrates the cooler inner planets through silicates`,
      inner.some((planet) => (planet.species.serpentine ?? 0) > 0),
    );
    check(
      `seed ${system.seed} leaves a rocky planet dry only where its feeding zone was too hot to hydrate silicates`,
      inner.every((planet) => serpentineFractionOf(planet) > 0
        || planet.semiMajorAxisAu < system.hydrationRadiusAu),
    );
    check(
      `seed ${system.seed} gives bodies beyond the snow line far more water than inner ones`,
      waterFractionBeyondSnowLine(system) > waterFractionInside(system) * 5,
    );
  }
});

checksNamed('formation is deterministic', (check) => {
  const first = formSystem(5);
  const again = formSystem(5);
  check(
    'the same seed rebuilds the same planets',
    first.planets.length === again.planets.length
      && first.planets.every((planet, index) => planet.massKg === again.planets[index]!.massKg
        && planet.semiMajorAxisAu === again.planets[index]!.semiMajorAxisAu),
  );
  check('different seeds build different systems', formSystem(6).planets.length !== 0);
});

function isGiant(planet: Planet): boolean {
  return planet.kind !== 'rocky';
}

function rockyPlanets(system: FormedSystem): Planet[] {
  return system.planets.filter((planet) => planet.kind === 'rocky');
}

function waterFractionInside(system: FormedSystem): number {
  return meanWaterFraction(system.planets.filter((p) => p.semiMajorAxisAu < system.snowLineAu));
}

function waterFractionBeyondSnowLine(system: FormedSystem): number {
  return meanWaterFraction(system.planets.filter((p) => p.semiMajorAxisAu >= system.snowLineAu));
}

function meanWaterFraction(planets: readonly Planet[]): number {
  if (planets.length === 0) return 0;
  const total = planets.reduce(
    (sum, planet) => sum + ((planet.species.waterIce ?? 0) + (planet.species.serpentine ?? 0) * 0.13)
      / totalPlanetMassKg(planet),
    0,
  );
  return total / planets.length;
}

function serpentineFractionOf(planet: Planet): number {
  return (planet.species.serpentine ?? 0) / planet.massKg;
}
