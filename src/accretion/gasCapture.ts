import { EARTH_MASS_KG } from '../units/constants';
import type { Embryo } from './embryoSeeding';

export type PlanetKind = 'rocky' | 'iceGiant' | 'gasGiant';

export interface Planet extends Embryo {
  kind: PlanetKind;
  envelopeMassKg: number;
}

const CRITICAL_CORE_MASS_EARTHS = 10;
const ICE_GIANT_ENVELOPE_FRACTION = 0.2;
const GAS_GIANT_ENVELOPE_MULTIPLE = 20;
const DISK_ASPECT_RATIO = 0.07;
const RUNAWAY_OVERSHOOT_OF_GAP_MASS = 3;

export function captureEnvelopes(
  embryos: readonly Embryo[],
  starMassKg: number,
  snowLineAu: number,
  gasRemains: boolean,
): Planet[] {
  const gapLimit = gapLimitedMassKg(starMassKg);
  return embryos.map((embryo) => planetFrom(embryo, snowLineAu, gasRemains, gapLimit));
}

function gapLimitedMassKg(starMassKg: number): number {
  return RUNAWAY_OVERSHOOT_OF_GAP_MASS * starMassKg * Math.pow(DISK_ASPECT_RATIO, 3);
}

function planetFrom(
  embryo: Embryo,
  snowLineAu: number,
  gasRemains: boolean,
  gapLimitKg: number,
): Planet {
  if (!reachesCriticalCore(embryo) || embryo.semiMajorAxisAu < snowLineAu) {
    return { ...embryo, kind: 'rocky', envelopeMassKg: 0 };
  }
  if (!gasRemains) {
    return { ...embryo, kind: 'iceGiant', envelopeMassKg: embryo.massKg * ICE_GIANT_ENVELOPE_FRACTION };
  }
  return { ...embryo, kind: 'gasGiant', envelopeMassKg: runawayEnvelopeMassKg(embryo, gapLimitKg) };
}

function runawayEnvelopeMassKg(embryo: Embryo, gapLimitKg: number): number {
  const unlimited = embryo.massKg * GAS_GIANT_ENVELOPE_MULTIPLE;
  return Math.max(0, Math.min(unlimited, gapLimitKg - embryo.massKg));
}

function reachesCriticalCore(embryo: Embryo): boolean {
  return embryo.massKg >= CRITICAL_CORE_MASS_EARTHS * EARTH_MASS_KG;
}

export function totalPlanetMassKg(planet: Planet): number {
  return planet.massKg + planet.envelopeMassKg;
}
