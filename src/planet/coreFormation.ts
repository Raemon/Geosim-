import { METAL_SPECIES, ROCK_SPECIES, type SpeciesAmounts } from '../disk/condensateSpecies';

export interface DifferentiatedInterior {
  coreMassKg: number;
  mantleMassKg: number;
  coreMassFraction: number;
}

export function differentiateByDensity(species: SpeciesAmounts): DifferentiatedInterior {
  const coreMassKg = sumOf(species, METAL_SPECIES);
  const mantleMassKg = sumOf(species, ROCK_SPECIES);
  const rockAndMetal = coreMassKg + mantleMassKg;
  return {
    coreMassKg,
    mantleMassKg,
    coreMassFraction: rockAndMetal > 0 ? coreMassKg / rockAndMetal : 0,
  };
}

function sumOf(species: SpeciesAmounts, ids: readonly string[]): number {
  return ids.reduce((total, id) => total + (species[id] ?? 0), 0);
}
