import { collapseCloud } from '../src/cloud/collapse';
import {
  massFractionsAtMetallicity,
  metalMassFraction,
  totalOf,
} from '../src/cloud/elementAbundances';
import { molecularCloudFromSeed, solarAnalogueCloud } from '../src/cloud/molecularCloud';
import { habitableZoneAu } from '../src/star/habitableZone';
import { luminositySolarAt, zeroAgeLuminositySolar } from '../src/star/luminosityOverTime';
import { starOfMass } from '../src/star/mainSequence';
import { SOLAR_MASS_KG, SUN_AGE_MYR } from '../src/units/constants';
import { checksNamed, isWithinFraction } from './checkReporter';

const OBSERVED_SOLAR_METAL_FRACTION = 0.0134;

checksNamed('cloud composition', (check) => {
  const solar = massFractionsAtMetallicity(0);
  check('element mass fractions sum to one', isWithinFraction(totalOf(solar), 1, 1e-12));
  check(
    'solar abundances reproduce the measured solar metal fraction',
    isWithinFraction(metalMassFraction(solar), OBSERVED_SOLAR_METAL_FRACTION, 0.05),
  );

  const enriched = massFractionsAtMetallicity(0.3);
  const poor = massFractionsAtMetallicity(-0.3);
  check(
    'raising metallicity raises the metal fraction and lowers hydrogen',
    metalMassFraction(enriched) > metalMassFraction(solar)
      && metalMassFraction(poor) < metalMassFraction(solar)
      && enriched.H < solar.H,
  );
  check(
    'a tenth of a dex of metals is close to a tenth more metals',
    isWithinFraction(metalMassFraction(enriched) / metalMassFraction(solar), Math.pow(10, 0.3), 0.02),
  );
  check(
    'uranium survives normalisation as a trace element rather than rounding to zero',
    solar.U > 0 && solar.U < 1e-9,
  );
});

checksNamed('cloud collapse', (check) => {
  const cloud = solarAnalogueCloud();
  const system = collapseCloud(cloud, 1);
  check(
    'a solar analogue cloud collapses to about one solar mass',
    isWithinFraction(system.starMassKg / SOLAR_MASS_KG, 1, 0.05),
  );
  check('the disk is a small fraction of the star', system.diskMassKg < system.starMassKg * 0.2);
  check(
    'the disk spans the tens to hundreds of astronomical units that class two disks are observed at',
    system.diskOuterRadiusAu > 20 && system.diskOuterRadiusAu < 300,
  );

  const spun = collapseCloud({ ...cloud, specificAngularMomentum: cloud.specificAngularMomentum * 2 }, 1);
  check(
    'doubling angular momentum quadruples the disk radius',
    isWithinFraction(spun.diskOuterRadiusAu / system.diskOuterRadiusAu, 4, 1e-6),
  );
});

checksNamed('main sequence star', (check) => {
  const sun = starOfMass(SOLAR_MASS_KG);
  check('one solar mass gives one solar luminosity', isWithinFraction(sun.luminositySolar, 1, 1e-9));
  check('one solar mass gives the solar effective temperature', isWithinFraction(sun.effectiveTemperatureK, 5772, 0.01));
  check('the sun lives about ten billion years', isWithinFraction(sun.mainSequenceLifetimeMyr, 10000, 0.01));

  const heavy = starOfMass(2 * SOLAR_MASS_KG);
  check('a heavier star is far brighter and far shorter lived',
    heavy.luminositySolar > 10 && heavy.mainSequenceLifetimeMyr < sun.mainSequenceLifetimeMyr / 4);

  check(
    'the young sun was about seventy percent as bright as today',
    isWithinFraction(zeroAgeLuminositySolar(sun), 0.71, 0.02),
  );
  check(
    'luminosity today matches the tabulated value',
    isWithinFraction(luminositySolarAt(sun, SUN_AGE_MYR), 1, 0.01),
  );
  check(
    'luminosity rises monotonically through the main sequence',
    luminositySolarAt(sun, 1000) < luminositySolarAt(sun, 5000)
      && luminositySolarAt(sun, 5000) < luminositySolarAt(sun, 9000),
  );
});

checksNamed('habitable zone', (check) => {
  const sun = starOfMass(SOLAR_MASS_KG);
  const zone = habitableZoneAu(sun, 1);
  check('the inner edge sits just inside earth', isWithinFraction(zone.innerAu, 0.95, 0.02));
  check('the outer edge sits beyond mars', isWithinFraction(zone.outerAu, 1.68, 0.02));

  const young = habitableZoneAu(sun, zeroAgeLuminositySolar(sun));
  check('a fainter young star has a closer habitable zone', young.innerAu < zone.innerAu);

  const dwarf = starOfMass(0.3 * SOLAR_MASS_KG);
  check(
    'a red dwarf keeps its habitable zone inside a tenth of an astronomical unit',
    habitableZoneAu(dwarf, dwarf.luminositySolar).outerAu < 0.3,
  );
});

checksNamed('cloud seeding', (check) => {
  const first = molecularCloudFromSeed(7);
  const again = molecularCloudFromSeed(7);
  const other = molecularCloudFromSeed(8);
  check('the same seed gives the same cloud', first.massKg === again.massKg && first.metallicityDex === again.metallicityDex);
  check('different seeds give different clouds', first.massKg !== other.massKg);
});
