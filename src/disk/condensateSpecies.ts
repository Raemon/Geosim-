import type { ElementSymbol } from '../cloud/elementAbundances';

export type Stoichiometry = Partial<Record<ElementSymbol, number>>;

export interface Condensate {
  id: string;
  name: string;
  condensationK: number;
  densityKgM3: number;
  formula: Stoichiometry;
}

export const CONDENSATES: readonly Condensate[] = [
  { id: 'thorianite', name: 'thorianite', condensationK: 1650, densityKgM3: 10000, formula: { Th: 1, O: 2 } },
  { id: 'uraninite', name: 'uraninite', condensationK: 1610, densityKgM3: 10900, formula: { U: 1, O: 2 } },
  { id: 'corundum', name: 'corundum', condensationK: 1677, densityKgM3: 3980, formula: { Al: 2, O: 3 } },
  { id: 'perovskite', name: 'perovskite', condensationK: 1580, densityKgM3: 4000, formula: { Ca: 1, Ti: 1, O: 3 } },
  { id: 'anorthite', name: 'anorthite', condensationK: 1387, densityKgM3: 2730, formula: { Ca: 1, Al: 2, Si: 2, O: 8 } },
  { id: 'diopside', name: 'diopside', condensationK: 1450, densityKgM3: 3400, formula: { Ca: 1, Mg: 1, Si: 2, O: 6 } },
  { id: 'forsterite', name: 'forsterite', condensationK: 1354, densityKgM3: 3270, formula: { Mg: 2, Si: 1, O: 4 } },
  { id: 'ironMetal', name: 'iron metal', condensationK: 1350, densityKgM3: 7870, formula: { Fe: 1 } },
  { id: 'nickelMetal', name: 'nickel metal', condensationK: 1350, densityKgM3: 8900, formula: { Ni: 1 } },
  { id: 'periclase', name: 'periclase', condensationK: 1340, densityKgM3: 3580, formula: { Mg: 1, O: 1 } },
  { id: 'enstatite', name: 'enstatite', condensationK: 1316, densityKgM3: 3200, formula: { Mg: 1, Si: 1, O: 3 } },
  { id: 'quartz', name: 'quartz', condensationK: 1300, densityKgM3: 2650, formula: { Si: 1, O: 2 } },
  { id: 'potassiumFeldspar', name: 'potassium feldspar', condensationK: 1000, densityKgM3: 2560, formula: { K: 1, Al: 1, Si: 3, O: 8 } },
  { id: 'albite', name: 'albite', condensationK: 970, densityKgM3: 2620, formula: { Na: 1, Al: 1, Si: 3, O: 8 } },
  { id: 'hydrogenSulphideIce', name: 'hydrogen sulphide ice', condensationK: 165, densityKgM3: 1000, formula: { H: 2, S: 1 } },
  { id: 'serpentine', name: 'hydrated silicate', condensationK: 400, densityKgM3: 2600, formula: { Mg: 3, Si: 2, O: 9, H: 4 } },
  { id: 'refractoryOrganics', name: 'refractory organics', condensationK: 350, densityKgM3: 1500, formula: { C: 1, H: 1 } },
  { id: 'waterIce', name: 'water ice', condensationK: 150, densityKgM3: 917, formula: { H: 2, O: 1 } },
  { id: 'ammoniaIce', name: 'ammonia ice', condensationK: 80, densityKgM3: 817, formula: { N: 1, H: 3 } },
  { id: 'methaneIce', name: 'methane ice', condensationK: 40, densityKgM3: 500, formula: { C: 1, H: 4 } },
  { id: 'carbonMonoxideIce', name: 'carbon monoxide ice', condensationK: 25, densityKgM3: 800, formula: { C: 1, O: 1 } },
];

export type SpeciesAmounts = Record<string, number>;

export function condensateById(id: string): Condensate {
  return CONDENSATES.find((species) => species.id === id)!;
}

export function emptySpeciesAmounts(): SpeciesAmounts {
  const amounts: SpeciesAmounts = {};
  for (const species of CONDENSATES) amounts[species.id] = 0;
  return amounts;
}

export function totalSpecies(amounts: SpeciesAmounts): number {
  return CONDENSATES.reduce((sum, species) => sum + (amounts[species.id] ?? 0), 0);
}

export const WATER_BEARING_SPECIES: readonly string[] = ['waterIce', 'serpentine'];
export const METAL_SPECIES: readonly string[] = ['ironMetal', 'nickelMetal'];
export const ROCK_SPECIES: readonly string[] = [
  'thorianite', 'uraninite', 'corundum', 'perovskite', 'anorthite', 'diopside', 'forsterite',
  'periclase', 'enstatite', 'quartz', 'potassiumFeldspar', 'albite',
];
