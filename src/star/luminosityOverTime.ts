import { ageFractionOfLifetime, SOLAR_AGE_FRACTION_TODAY, type Star } from './mainSequence';

const HYDROGEN_DEPLETION_BRIGHTENING = 0.4;

export function luminositySolarAt(star: Star, ageMyr: number): number {
  const elapsed = ageFractionOfLifetime(star, ageMyr) / SOLAR_AGE_FRACTION_TODAY;
  return star.luminositySolar / (1 + HYDROGEN_DEPLETION_BRIGHTENING * (1 - elapsed));
}

export function zeroAgeLuminositySolar(star: Star): number {
  return luminositySolarAt(star, 0);
}
