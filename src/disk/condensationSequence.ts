import { CONDENSATES, emptySpeciesAmounts, totalSpecies, type SpeciesAmounts } from './condensateSpecies';

export function solidSpeciesAt(allSpecies: SpeciesAmounts, temperatureK: number): SpeciesAmounts {
  const solid = emptySpeciesAmounts();
  for (const species of CONDENSATES) {
    solid[species.id] = temperatureK < species.condensationK ? (allSpecies[species.id] ?? 0) : 0;
  }
  return solid;
}

export function solidMassFractionAt(allSpecies: SpeciesAmounts, temperatureK: number): number {
  return totalSpecies(solidSpeciesAt(allSpecies, temperatureK));
}

export function dominantCondensateAt(allSpecies: SpeciesAmounts, temperatureK: number): string {
  const solid = solidSpeciesAt(allSpecies, temperatureK);
  return CONDENSATES.reduce(
    (best, species) => ((solid[species.id] ?? 0) > (solid[best] ?? 0) ? species.id : best),
    CONDENSATES[0]!.id,
  );
}

export function meanSolidDensityAt(allSpecies: SpeciesAmounts, temperatureK: number): number {
  const solid = solidSpeciesAt(allSpecies, temperatureK);
  const mass = totalSpecies(solid);
  if (mass <= 0) return 0;
  const volume = CONDENSATES.reduce(
    (sum, species) => sum + (solid[species.id] ?? 0) / species.densityKgM3,
    0,
  );
  return mass / volume;
}
