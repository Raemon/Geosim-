import { streamFor } from '../random/mulberry32';
import { SOLAR_MASS_KG } from '../units/constants';
import { massFractionsAtMetallicity, type ElementAmounts } from './elementAbundances';

export interface MolecularCloud {
  massKg: number;
  metallicityDex: number;
  specificAngularMomentum: number;
  elementMassFractions: ElementAmounts;
}

const CLOUD_MASS_RANGE_SOLAR = [1.2, 6.0] as const;
const METALLICITY_RANGE_DEX = [-0.4, 0.35] as const;
const SPECIFIC_ANGULAR_MOMENTUM_RANGE = [2.0e16, 6.0e16] as const;

export function molecularCloudFromSeed(seed: number): MolecularCloud {
  const random = streamFor(seed, 'molecular cloud');
  const metallicityDex = random.between(...METALLICITY_RANGE_DEX);
  return {
    massKg: random.between(...CLOUD_MASS_RANGE_SOLAR) * SOLAR_MASS_KG,
    metallicityDex,
    specificAngularMomentum: random.between(...SPECIFIC_ANGULAR_MOMENTUM_RANGE),
    elementMassFractions: massFractionsAtMetallicity(metallicityDex),
  };
}

export function solarAnalogueCloud(): MolecularCloud {
  return {
    massKg: 3.3 * SOLAR_MASS_KG,
    metallicityDex: 0,
    specificAngularMomentum: 3.2e16,
    elementMassFractions: massFractionsAtMetallicity(0),
  };
}
