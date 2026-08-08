import { massFractionsAtMetallicity } from '../src/cloud/elementAbundances';
import { partitionElementsIntoSpecies, speciesMassesFrom } from '../src/disk/partitionElements';
import { differentiateByDensity } from '../src/planet/coreFormation';
import { degasVolatiles } from '../src/planet/degassing';
import { mantleMineralogyOf } from '../src/planet/mantleMineralogy';
import {
  meanDensityKgM3,
  oceanDepthIfSpreadEvenlyM,
  rockyPlanetFrom,
  type RockyPlanet,
} from '../src/planet/planetBody';
import { radiogenicHeatFromElement, radiogenicHeatWatts } from '../src/planet/radiogenicHeat';
import { solidSpeciesAt } from '../src/disk/condensationSequence';
import { totalSpecies } from '../src/disk/condensateSpecies';
import { formSystem } from '../src/sim/formSystem';
import { EARTH_MASS_KG, EARTH_OCEAN_MASS_KG, SUN_AGE_MYR } from '../src/units/constants';
import { checksNamed, isWithinFraction } from './checkReporter';

const SOLAR_SPECIES = speciesMassesFrom(partitionElementsIntoSpecies(massFractionsAtMetallicity(0)));

const INNER_DISK_CONDENSATION_K = 1100;
const INNER_DISK_SOLIDS = solidSpeciesAt(SOLAR_SPECIES, INNER_DISK_CONDENSATION_K);

function innerDiskSolidsScaledToMass(massKg: number): Record<string, number> {
  const total = totalSpecies(INNER_DISK_SOLIDS);
  const scaled: Record<string, number> = {};
  for (const id of Object.keys(INNER_DISK_SOLIDS)) {
    scaled[id] = ((INNER_DISK_SOLIDS[id] ?? 0) / total) * massKg;
  }
  return scaled;
}

checksNamed('core formation', (check) => {
  const solar = differentiateByDensity(SOLAR_SPECIES);
  check(
    'a solar mix differentiates to about a third core by mass, as earth did',
    isWithinFraction(solar.coreMassFraction, 0.325, 0.12),
  );

  const ironRich = massFractionsAtMetallicity(0);
  const enriched = differentiateByDensity(
    speciesMassesFrom(partitionElementsIntoSpecies({ ...ironRich, Fe: ironRich.Fe * 2 })),
  );
  check('doubling iron makes a markedly larger core', enriched.coreMassFraction > solar.coreMassFraction * 1.4);
  check(
    'core and mantle together account for all the rock and metal',
    isWithinFraction(solar.coreMassKg + solar.mantleMassKg, solar.coreMassKg / solar.coreMassFraction, 1e-9),
  );
});

checksNamed('mantle mineralogy', (check) => {
  const mineralogy = mantleMineralogyOf(SOLAR_SPECIES);
  check(
    'the mantle inherits a magnesium to silicon ratio near the solar value of one',
    isWithinFraction(mineralogy.magnesiumToSiliconMolar, 1.02, 0.2),
  );
  check(
    'both olivine and pyroxene are present rather than one dominating entirely',
    mineralogy.olivineMassFraction > 0.1 && mineralogy.olivineMassFraction < 0.9,
  );
});

checksNamed('radiogenic heat budget', (check) => {
  const earthLike = innerDiskSolidsScaledToMass(EARTH_MASS_KG);
  const today = radiogenicHeatWatts(earthLike, SUN_AGE_MYR);
  const uraniumAndThorium = radiogenicHeatFromElement(earthLike, 'U', SUN_AGE_MYR)
    + radiogenicHeatFromElement(earthLike, 'Th', SUN_AGE_MYR);
  check(
    'uranium and thorium in an earth mass of inner disk rock give earth sixteen terawatts today',
    isWithinFraction(uraniumAndThorium / 1e12, 16, 0.3),
  );
  check(
    'potassium is absent from inner disk rock because its feldspar never condensed that hot',
    radiogenicHeatFromElement(earthLike, 'K', SUN_AGE_MYR) === 0,
  );
  check(
    'a planet formed from cool inner disk solids instead keeps solar potassium and runs hotter '
      + 'than earth, which is this model failing to reproduce the terrestrial volatility trend',
    radiogenicHeatFromElement(solidSpeciesAt(SOLAR_SPECIES, 300), 'K', SUN_AGE_MYR) > 0,
  );
  check(
    'the young planet ran several times hotter, which is what drove komatiites',
    radiogenicHeatWatts(earthLike, 0) > today * 3,
  );
  check(
    'heat production falls monotonically with age',
    [0, 1000, 2000, 3000, 4500, 8000]
      .map((age) => radiogenicHeatWatts(earthLike, age))
      .every((heat, index, all) => index === 0 || heat < all[index - 1]!),
  );
  check(
    'a planet with no rock produces no heat',
    radiogenicHeatWatts(innerDiskSolidsScaledToMass(0), SUN_AGE_MYR) === 0,
  );
});

checksNamed('degassing and oceans', (check) => {
  const wet = degasVolatiles(SOLAR_SPECIES);
  check('a solar mix degasses water, carbon dioxide and nitrogen', wet.waterMassKg > 0
    && wet.carbonDioxideMassKg > 0 && wet.nitrogenMassKg > 0);
  check(
    'a body with no volatile carriers degasses nothing',
    degasVolatiles({ forsterite: 1, ironMetal: 1 }).waterMassKg === 0,
  );

  const hydrated = earthMassRockyPlanet();
  check(
    'the nearest thing to an earth mass planet ends up within an order of magnitude of one earth ocean',
    hydrated.volatiles.waterMassKg / EARTH_OCEAN_MASS_KG > 0.1
      && hydrated.volatiles.waterMassKg / EARTH_OCEAN_MASS_KG < 10,
  );
  check(
    'spread evenly that water is kilometres deep, not metres and not hundreds of kilometres',
    oceanDepthIfSpreadEvenlyM(hydrated) > 200 && oceanDepthIfSpreadEvenlyM(hydrated) < 20000,
  );
});

checksNamed('planet bulk properties', (check) => {
  const planet = earthMassRockyPlanet();
  check(
    'a rocky planet has a density between water and iron, and above uncompressed rock',
    meanDensityKgM3(planet) > 3000 && meanDensityKgM3(planet) < 9000,
  );
  check('surface gravity is within a few times earth', planet.surfaceGravityMS2 > 3
    && planet.surfaceGravityMS2 < 40);
  check(
    'core plus mantle never exceeds the planet mass',
    planet.interior.coreMassKg + planet.interior.mantleMassKg <= planet.massKg * 1.000001,
  );
});

function earthMassRockyPlanet(): RockyPlanet {
  const candidates = [1, 2, 3, 7, 11, 19]
    .flatMap((seed) => {
      const system = formSystem(seed);
      return system.planets
        .filter((planet) => planet.kind === 'rocky' && planet.semiMajorAxisAu < system.snowLineAu)
        .map(rockyPlanetFrom);
    })
    .filter((planet) => planet.volatiles.waterMassKg > 0);
  return candidates.sort(
    (a, b) => Math.abs(a.massKg - EARTH_MASS_KG) - Math.abs(b.massKg - EARTH_MASS_KG),
  )[0]!;
}
