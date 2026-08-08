import { atomicWeightOf, type ElementSymbol } from '../cloud/elementAbundances';
import { condensateById, type SpeciesAmounts } from '../disk/condensateSpecies';
import { SUN_AGE_MYR } from '../units/constants';

type ParentElement = 'U' | 'Th' | 'K';

interface Radioisotope {
  carrierSpecies: string;
  parentElement: ParentElement;
  fractionOfElementToday: number;
  halfLifeMyr: number;
  heatWattsPerKg: number;
}

const RADIOISOTOPES: readonly Radioisotope[] = [
  { carrierSpecies: 'uraninite', parentElement: 'U', fractionOfElementToday: 0.992745, halfLifeMyr: 4468, heatWattsPerKg: 9.46e-5 },
  { carrierSpecies: 'uraninite', parentElement: 'U', fractionOfElementToday: 0.007204, halfLifeMyr: 704, heatWattsPerKg: 5.69e-4 },
  { carrierSpecies: 'thorianite', parentElement: 'Th', fractionOfElementToday: 1, halfLifeMyr: 14050, heatWattsPerKg: 2.64e-5 },
  { carrierSpecies: 'potassiumFeldspar', parentElement: 'K', fractionOfElementToday: 1.17e-4, halfLifeMyr: 1248, heatWattsPerKg: 2.92e-5 },
];

export function radiogenicHeatWatts(species: SpeciesAmounts, ageMyr: number): number {
  return heatFrom(RADIOISOTOPES, species, ageMyr);
}

export function radiogenicHeatFromElement(
  species: SpeciesAmounts,
  element: ParentElement,
  ageMyr: number,
): number {
  return heatFrom(RADIOISOTOPES.filter((isotope) => isotope.parentElement === element), species, ageMyr);
}

function heatFrom(
  isotopes: readonly Radioisotope[],
  species: SpeciesAmounts,
  ageMyr: number,
): number {
  return isotopes.reduce((total, isotope) => total + isotopeHeatWatts(species, isotope, ageMyr), 0);
}

function isotopeHeatWatts(species: SpeciesAmounts, isotope: Radioisotope, ageMyr: number): number {
  return massAtFormationKg(species, isotope)
    * remainingFraction(isotope, ageMyr)
    * isotope.heatWattsPerKg;
}

function massAtFormationKg(species: SpeciesAmounts, isotope: Radioisotope): number {
  const today = elementMassKg(species, isotope) * isotope.fractionOfElementToday;
  return today / remainingFraction(isotope, SUN_AGE_MYR);
}

function remainingFraction(isotope: Radioisotope, ageMyr: number): number {
  return Math.pow(0.5, ageMyr / isotope.halfLifeMyr);
}

function elementMassKg(species: SpeciesAmounts, isotope: Radioisotope): number {
  const carrier = condensateById(isotope.carrierSpecies);
  const count = carrier.formula[isotope.parentElement] ?? 0;
  if (count === 0) return 0;
  return ((species[isotope.carrierSpecies] ?? 0) / molarMassOf(isotope.carrierSpecies))
    * count * atomicWeightOf(isotope.parentElement);
}

function molarMassOf(id: string): number {
  return Object.entries(condensateById(id).formula)
    .reduce((sum, [symbol, count]) => sum + count * atomicWeightOf(symbol as ElementSymbol), 0);
}
