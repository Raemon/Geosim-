import { atomicWeightOf } from '../cloud/elementAbundances';
import { condensateById, type SpeciesAmounts } from '../disk/condensateSpecies';

export interface VolatileInventory {
  waterMassKg: number;
  carbonDioxideMassKg: number;
  nitrogenMassKg: number;
}

const DEGASSING_EFFICIENCY = 0.6;
const VOLATILE_RETENTION_THROUGH_ACCRETION = 0.2;
const WATER_MOLAR_MASS = 18.015;
const CARBON_DIOXIDE_MOLAR_MASS = 44.009;
const AMMONIA_TO_NITROGEN = 14.007 / 17.031;

const WATER_CARRIERS = ['waterIce', 'serpentine'] as const;
const CARBON_CARRIERS = ['refractoryOrganics', 'methaneIce', 'carbonMonoxideIce'] as const;

export function degasVolatiles(species: SpeciesAmounts): VolatileInventory {
  const reaching = DEGASSING_EFFICIENCY * VOLATILE_RETENTION_THROUGH_ACCRETION;
  return {
    waterMassKg: reaching * waterHeldInCarriers(species),
    carbonDioxideMassKg: reaching * carbonDioxideFromCarbon(species),
    nitrogenMassKg: reaching * (species.ammoniaIce ?? 0) * AMMONIA_TO_NITROGEN,
  };
}

function waterHeldInCarriers(species: SpeciesAmounts): number {
  return WATER_CARRIERS.reduce(
    (total, id) => total + hydrogenMolesIn(species, id) * 0.5 * WATER_MOLAR_MASS,
    0,
  );
}

function carbonDioxideFromCarbon(species: SpeciesAmounts): number {
  return CARBON_CARRIERS.reduce(
    (total, id) => total + elementMolesIn(species, id, 'C') * CARBON_DIOXIDE_MOLAR_MASS,
    0,
  );
}

function hydrogenMolesIn(species: SpeciesAmounts, id: string): number {
  return elementMolesIn(species, id, 'H');
}

function elementMolesIn(species: SpeciesAmounts, id: string, symbol: 'H' | 'C'): number {
  const count = condensateById(id).formula[symbol] ?? 0;
  if (count === 0) return 0;
  return ((species[id] ?? 0) / molarMassOf(id)) * count;
}

function molarMassOf(id: string): number {
  return Object.entries(condensateById(id).formula)
    .reduce((sum, [symbol, count]) => sum + count * atomicWeightOf(symbol as 'H'), 0);
}
