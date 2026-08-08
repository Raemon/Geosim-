import {
  atomicWeightOf,
  mapElements,
  type ElementAmounts,
  type ElementSymbol,
} from '../cloud/elementAbundances';
import {
  CONDENSATES,
  condensateById,
  emptySpeciesAmounts,
  type SpeciesAmounts,
} from './condensateSpecies';

const SERPENTINE_SHARE_OF_MAGNESIUM = 0.08;
const ORGANIC_SHARE_OF_CARBON = 0.5;
const CARBON_MONOXIDE_SHARE_OF_REMAINING_CARBON = 0.5;

export function partitionElementsIntoSpecies(massFractions: ElementAmounts): SpeciesAmounts {
  const available = molesFrom(massFractions);
  const moles = emptySpeciesAmounts();
  allocateRefractoryOxides(available, moles);
  allocateFeldspars(available, moles);
  allocateMetal(available, moles);
  allocateMagnesiumSilicates(available, moles);
  allocateCarbonAndIces(available, moles);
  return moles;
}

export function speciesMassesFrom(moles: SpeciesAmounts): SpeciesAmounts {
  const masses = emptySpeciesAmounts();
  for (const species of CONDENSATES) {
    masses[species.id] = (moles[species.id] ?? 0) * molarMassOf(species.id);
  }
  return masses;
}

export function elementMolesLockedInSpecies(moles: SpeciesAmounts, symbol: ElementSymbol): number {
  return CONDENSATES.reduce(
    (sum, species) => sum + (moles[species.id] ?? 0) * (species.formula[symbol] ?? 0),
    0,
  );
}

function molesFrom(massFractions: ElementAmounts): ElementAmounts {
  return mapElements((element) => massFractions[element.symbol] / element.atomicWeight);
}

function molarMassOf(id: string): number {
  return Object.entries(condensateById(id).formula)
    .reduce((sum, [symbol, count]) => sum + count * atomicWeightOf(symbol as ElementSymbol), 0);
}

function take(available: ElementAmounts, moles: SpeciesAmounts, id: string, limit: number): void {
  const formula = condensateById(id).formula;
  const amount = Math.min(limit, ...formulaLimits(available, formula));
  if (!(amount > 0)) return;
  moles[id] = (moles[id] ?? 0) + amount;
  for (const [symbol, count] of Object.entries(formula)) {
    available[symbol as ElementSymbol] -= amount * count;
  }
}

function formulaLimits(available: ElementAmounts, formula: Record<string, number>): number[] {
  return Object.entries(formula)
    .map(([symbol, count]) => available[symbol as ElementSymbol] / count);
}

function allocateRefractoryOxides(available: ElementAmounts, moles: SpeciesAmounts): void {
  take(available, moles, 'thorianite', available.Th);
  take(available, moles, 'uraninite', available.U);
  take(available, moles, 'perovskite', available.Ti);
}

function allocateFeldspars(available: ElementAmounts, moles: SpeciesAmounts): void {
  take(available, moles, 'potassiumFeldspar', available.K);
  take(available, moles, 'albite', available.Na);
  take(available, moles, 'anorthite', available.Ca);
  take(available, moles, 'diopside', available.Ca);
  take(available, moles, 'corundum', available.Al);
}

function allocateMetal(available: ElementAmounts, moles: SpeciesAmounts): void {
  take(available, moles, 'ironMetal', available.Fe);
  take(available, moles, 'nickelMetal', available.Ni);
}

function allocateMagnesiumSilicates(available: ElementAmounts, moles: SpeciesAmounts): void {
  take(available, moles, 'serpentine', (available.Mg * SERPENTINE_SHARE_OF_MAGNESIUM) / 3);
  const magnesium = available.Mg;
  const silicon = available.Si;
  take(available, moles, 'forsterite', Math.max(0, magnesium - silicon));
  take(available, moles, 'enstatite', Math.max(0, 2 * silicon - magnesium));
  take(available, moles, 'periclase', available.Mg);
  take(available, moles, 'quartz', available.Si);
}

function allocateCarbonAndIces(available: ElementAmounts, moles: SpeciesAmounts): void {
  take(available, moles, 'refractoryOrganics', available.C * ORGANIC_SHARE_OF_CARBON);
  take(available, moles, 'carbonMonoxideIce', available.C * CARBON_MONOXIDE_SHARE_OF_REMAINING_CARBON);
  take(available, moles, 'methaneIce', available.C);
  take(available, moles, 'ammoniaIce', available.N);
  take(available, moles, 'hydrogenSulphideIce', available.S);
  take(available, moles, 'waterIce', available.O);
}
