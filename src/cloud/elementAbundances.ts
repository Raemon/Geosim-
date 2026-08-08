export type ElementSymbol =
  | 'H' | 'He' | 'C' | 'N' | 'O' | 'Ne' | 'Na' | 'Mg' | 'Al'
  | 'Si' | 'S' | 'Ca' | 'Ti' | 'Fe' | 'Ni' | 'K' | 'U' | 'Th';

interface ElementAbundance {
  symbol: ElementSymbol;
  atomicWeight: number;
  solarAtomsPerMillionSilicon: number;
}

export const ELEMENTS: readonly ElementAbundance[] = [
  { symbol: 'H', atomicWeight: 1.008, solarAtomsPerMillionSilicon: 2.59e10 },
  { symbol: 'He', atomicWeight: 4.003, solarAtomsPerMillionSilicon: 2.51e9 },
  { symbol: 'C', atomicWeight: 12.011, solarAtomsPerMillionSilicon: 7.19e6 },
  { symbol: 'N', atomicWeight: 14.007, solarAtomsPerMillionSilicon: 1.95e6 },
  { symbol: 'O', atomicWeight: 15.999, solarAtomsPerMillionSilicon: 1.34e7 },
  { symbol: 'Ne', atomicWeight: 20.180, solarAtomsPerMillionSilicon: 2.31e6 },
  { symbol: 'Na', atomicWeight: 22.990, solarAtomsPerMillionSilicon: 5.75e4 },
  { symbol: 'Mg', atomicWeight: 24.305, solarAtomsPerMillionSilicon: 1.02e6 },
  { symbol: 'Al', atomicWeight: 26.982, solarAtomsPerMillionSilicon: 8.41e4 },
  { symbol: 'Si', atomicWeight: 28.086, solarAtomsPerMillionSilicon: 1.0e6 },
  { symbol: 'S', atomicWeight: 32.06, solarAtomsPerMillionSilicon: 4.45e5 },
  { symbol: 'Ca', atomicWeight: 40.078, solarAtomsPerMillionSilicon: 6.29e4 },
  { symbol: 'Ti', atomicWeight: 47.867, solarAtomsPerMillionSilicon: 2.42e3 },
  { symbol: 'Fe', atomicWeight: 55.845, solarAtomsPerMillionSilicon: 8.38e5 },
  { symbol: 'Ni', atomicWeight: 58.693, solarAtomsPerMillionSilicon: 4.78e4 },
  { symbol: 'K', atomicWeight: 39.098, solarAtomsPerMillionSilicon: 3.7e3 },
  { symbol: 'U', atomicWeight: 238.029, solarAtomsPerMillionSilicon: 9.2e-3 },
  { symbol: 'Th', atomicWeight: 232.038, solarAtomsPerMillionSilicon: 3.35e-2 },
];

export type ElementAmounts = Record<ElementSymbol, number>;

const HYDROGEN_AND_HELIUM: readonly ElementSymbol[] = ['H', 'He'];

export function isMetal(symbol: ElementSymbol): boolean {
  return !HYDROGEN_AND_HELIUM.includes(symbol);
}

export function massFractionsAtMetallicity(metallicityDex: number): ElementAmounts {
  const scale = Math.pow(10, metallicityDex);
  const masses = elementMassesPerMillionSilicon(scale);
  return normalizedToUnitSum(masses);
}

function elementMassesPerMillionSilicon(metalScale: number): ElementAmounts {
  return mapElements((element) => {
    const atoms = element.solarAtomsPerMillionSilicon * (isMetal(element.symbol) ? metalScale : 1);
    return atoms * element.atomicWeight;
  });
}

function normalizedToUnitSum(amounts: ElementAmounts): ElementAmounts {
  const total = totalOf(amounts);
  return mapElements((element) => amounts[element.symbol] / total);
}

export function metalMassFraction(fractions: ElementAmounts): number {
  return ELEMENTS.filter((element) => isMetal(element.symbol))
    .reduce((sum, element) => sum + fractions[element.symbol], 0);
}

export function scaledBy(amounts: ElementAmounts, factor: number): ElementAmounts {
  return mapElements((element) => amounts[element.symbol] * factor);
}

export function totalOf(amounts: ElementAmounts): number {
  return ELEMENTS.reduce((sum, element) => sum + amounts[element.symbol], 0);
}

export function emptyAmounts(): ElementAmounts {
  return mapElements(() => 0);
}

export function mapElements(valueOf: (element: ElementAbundance) => number): ElementAmounts {
  const amounts = {} as ElementAmounts;
  for (const element of ELEMENTS) amounts[element.symbol] = valueOf(element);
  return amounts;
}

export function atomicWeightOf(symbol: ElementSymbol): number {
  return ELEMENTS.find((element) => element.symbol === symbol)!.atomicWeight;
}

export function molesOf(amounts: ElementAmounts, symbol: ElementSymbol): number {
  return amounts[symbol] / atomicWeightOf(symbol);
}
