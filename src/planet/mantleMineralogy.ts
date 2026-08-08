import { condensateById, type SpeciesAmounts } from '../disk/condensateSpecies';
import { atomicWeightOf, type ElementSymbol } from '../cloud/elementAbundances';

const SILICATE_SPECIES = ['forsterite', 'enstatite', 'diopside', 'anorthite', 'albite', 'potassiumFeldspar', 'quartz', 'periclase'] as const;

export interface MantleMineralogy {
  magnesiumToSiliconMolar: number;
  olivineMassFraction: number;
}

export function mantleMineralogyOf(species: SpeciesAmounts): MantleMineralogy {
  const olivine = species.forsterite ?? 0;
  const pyroxene = species.enstatite ?? 0;
  const silicates = SILICATE_SPECIES.reduce((total, id) => total + (species[id] ?? 0), 0);
  return {
    magnesiumToSiliconMolar: elementMoles(species, 'Mg') / Math.max(elementMoles(species, 'Si'), 1e-30),
    olivineMassFraction: silicates > 0 ? olivine / (olivine + pyroxene + 1e-30) : 0,
  };
}

function elementMoles(species: SpeciesAmounts, symbol: ElementSymbol): number {
  return SILICATE_SPECIES.reduce(
    (total, id) => total + molesOfElementIn(species, id, symbol),
    0,
  );
}

function molesOfElementIn(species: SpeciesAmounts, id: string, symbol: ElementSymbol): number {
  const condensate = condensateById(id);
  const count = condensate.formula[symbol] ?? 0;
  if (count === 0) return 0;
  return ((species[id] ?? 0) / molarMassOf(id)) * count;
}

function molarMassOf(id: string): number {
  return Object.entries(condensateById(id).formula)
    .reduce((sum, [symbol, count]) => sum + count * atomicWeightOf(symbol as ElementSymbol), 0);
}
