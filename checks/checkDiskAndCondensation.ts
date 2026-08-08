import { massFractionsAtMetallicity, molesOf } from '../src/cloud/elementAbundances';
import { CONDENSATES, ROCK_SPECIES, totalSpecies } from '../src/disk/condensateSpecies';
import { dominantCondensateAt, solidMassFractionAt, solidSpeciesAt } from '../src/disk/condensationSequence';
import { combinedTemperatureAt } from '../src/disk/midplaneTemperature';
import {
  elementMolesLockedInSpecies,
  partitionElementsIntoSpecies,
  speciesMassesFrom,
} from '../src/disk/partitionElements';
import { logarithmicRadialGrid } from '../src/disk/radialGrid';
import { snowLineAu } from '../src/disk/snowLine';
import { diskSolids } from '../src/disk/solidComposition';
import { annulusGasMassKg, gasSurfaceDensityKgM2 } from '../src/disk/surfaceDensity';
import { SOLAR_MASS_KG } from '../src/units/constants';
import { checksNamed, isWithinFraction } from './checkReporter';

const SOLAR = massFractionsAtMetallicity(0);
const SOLAR_MOLES = partitionElementsIntoSpecies(SOLAR);
const SOLAR_MASSES = speciesMassesFrom(SOLAR_MOLES);

checksNamed('element partitioning into condensates', (check) => {
  for (const symbol of ['Mg', 'Si', 'Fe', 'Ca', 'Al', 'K', 'U', 'Th'] as const) {
    check(
      `partitioning never invents or destroys ${symbol}`,
      isWithinFraction(elementMolesLockedInSpecies(SOLAR_MOLES, symbol), molesOf(SOLAR, symbol), 1e-9),
    );
  }
  check(
    'oxygen is fully consumed because water ice mops up whatever the silicates leave',
    isWithinFraction(elementMolesLockedInSpecies(SOLAR_MOLES, 'O'), molesOf(SOLAR, 'O'), 1e-9),
  );
  check('every condensate mass is non negative', CONDENSATES.every((s) => (SOLAR_MASSES[s.id] ?? 0) >= 0));
  check(
    'solar magnesium to silicon leaves both olivine and pyroxene present',
    (SOLAR_MASSES.forsterite ?? 0) > 0 && (SOLAR_MASSES.enstatite ?? 0) > 0,
  );
});

checksNamed('bulk rock composition of a solar mix', (check) => {
  const rock = ROCK_SPECIES.reduce((sum, id) => sum + (SOLAR_MASSES[id] ?? 0), 0);
  const metal = (SOLAR_MASSES.ironMetal ?? 0) + (SOLAR_MASSES.nickelMetal ?? 0);
  check(
    'iron metal is about a third of the rock plus metal a rocky planet is built from, as bulk earth is',
    isWithinFraction(metal / (metal + rock), 0.325, 0.15),
  );
  check(
    'uranium sits near twenty parts per billion of the rock, as bulk earth does',
    (SOLAR_MASSES.uraninite ?? 0) / rock > 5e-9 && (SOLAR_MASSES.uraninite ?? 0) / rock < 8e-8,
  );
  check(
    'potassium feldspar carries the potassium the mantle heat budget needs',
    (SOLAR_MASSES.potassiumFeldspar ?? 0) > 0,
  );
});

checksNamed('condensation sequence', (check) => {
  const temperatures = [2000, 1500, 1200, 800, 500, 300, 200, 100, 30, 10];
  const fractions = temperatures.map((t) => solidMassFractionAt(SOLAR_MASSES, t));
  check('nothing is solid above the most refractory condensation point', fractions[0] === 0);
  check(
    'the solid fraction only ever grows as the gas cools',
    fractions.every((fraction, index) => index === 0 || fraction >= fractions[index - 1]!),
  );
  check(
    'cooling to the coldest bin condenses essentially everything but hydrogen and helium',
    isWithinFraction(fractions[fractions.length - 1]!, totalSpecies(SOLAR_MASSES), 1e-9),
  );
  check(
    'the inner disk condenses only a fraction of a percent of its mass as rock',
    solidMassFractionAt(SOLAR_MASSES, 1200) < 0.01 && solidMassFractionAt(SOLAR_MASSES, 1200) > 0.001,
  );
  check(
    'crossing the water ice point at least half again multiplies the available solids',
    solidMassFractionAt(SOLAR_MASSES, 100) / solidMassFractionAt(SOLAR_MASSES, 200) > 1.5,
  );
  check(
    'silicates dominate warm solids and water ice dominates cold ones',
    dominantCondensateAt(SOLAR_MASSES, 1000) !== 'waterIce'
      && dominantCondensateAt(SOLAR_MASSES, 100) === 'waterIce',
  );
  check(
    'sulphur is still gas at one astronomical unit, which is why rocky planets end up sulphur poor',
    solidSpeciesAt(SOLAR_MASSES, combinedTemperatureAt(1, 1, 3)).hydrogenSulphideIce === 0,
  );
});

checksNamed('snow line', (check) => {
  const earlySnowLine = snowLineAu(1, 0.1);
  const lateSnowLine = snowLineAu(1, 3);
  check('the snow line sits beyond the asteroid belt while the disk is hot', earlySnowLine > 3);
  check('the snow line migrates inward as viscous heating dies away', lateSnowLine < earlySnowLine);
  check(
    'a cooled disk parks the snow line in the two to four unit range the solar system records',
    lateSnowLine > 2 && lateSnowLine < 4,
  );
  check('a brighter star pushes the snow line outward', snowLineAu(4, 3) > lateSnowLine);
});

checksNamed('disk structure', (check) => {
  const grid = logarithmicRadialGrid(50, 200);
  const diskMassKg = 0.08 * SOLAR_MASS_KG;
  const gas = gasSurfaceDensityKgM2(grid, diskMassKg, 50);
  let total = 0;
  for (let cell = 0; cell < grid.cellCount; cell++) total += annulusGasMassKg(grid, gas, cell);
  check('the surface density profile integrates to the disk mass', isWithinFraction(total, diskMassKg, 0.02));
  check(
    'surface density falls monotonically outward',
    gas.every((value, cell) => cell === 0 || value <= gas[cell - 1]!),
  );

  const solids = diskSolids({
    grid,
    diskMassKg,
    diskOuterRadiusAu: 50,
    luminositySolar: 1,
    diskAgeMyr: 3,
    elementMassFractions: SOLAR,
  });
  check(
    'midplane temperature falls monotonically outward',
    solids.temperatureK.every((value, cell) => cell === 0 || value <= solids.temperatureK[cell - 1]!),
  );
  check(
    'the solid fraction only ever rises outward, because cooling can only condense more',
    solids.solidFractionOfTotal.every(
      (value, cell) => cell === 0 || value >= solids.solidFractionOfTotal[cell - 1]! - 1e-12,
    ),
  );
  check(
    'the terrestrial region has a hundred times less solid surface density than gas',
    solids.solidFractionOfTotal[cellNear(grid.radiusAu, 1)]! < 0.01,
  );
});

function cellNear(radii: Float64Array, targetAu: number): number {
  let best = 0;
  for (let cell = 0; cell < radii.length; cell++) {
    if (Math.abs(radii[cell]! - targetAu) < Math.abs(radii[best]! - targetAu)) best = cell;
  }
  return best;
}
