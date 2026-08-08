import { SOLAR_EFFECTIVE_TEMPERATURE_K } from '../units/constants';
import type { Star } from './mainSequence';

export interface HabitableZoneAu {
  innerAu: number;
  outerAu: number;
}

const RUNAWAY_GREENHOUSE = { base: 1.107, a: 1.332e-4, b: 1.58e-8, c: -8.308e-12, d: -1.931e-15 };
const MAXIMUM_GREENHOUSE = { base: 0.356, a: 6.171e-5, b: 1.698e-9, c: -3.198e-12, d: -5.575e-16 };

export function habitableZoneAu(star: Star, luminositySolar: number): HabitableZoneAu {
  const temperatureOffset = star.effectiveTemperatureK - SOLAR_EFFECTIVE_TEMPERATURE_K;
  return {
    innerAu: distanceForFlux(luminositySolar, effectiveFlux(RUNAWAY_GREENHOUSE, temperatureOffset)),
    outerAu: distanceForFlux(luminositySolar, effectiveFlux(MAXIMUM_GREENHOUSE, temperatureOffset)),
  };
}

interface FluxCoefficients {
  base: number;
  a: number;
  b: number;
  c: number;
  d: number;
}

function effectiveFlux(coefficients: FluxCoefficients, offsetK: number): number {
  return coefficients.base
    + coefficients.a * offsetK
    + coefficients.b * offsetK ** 2
    + coefficients.c * offsetK ** 3
    + coefficients.d * offsetK ** 4;
}

function distanceForFlux(luminositySolar: number, effectiveFluxSolar: number): number {
  return Math.sqrt(luminositySolar / effectiveFluxSolar);
}
