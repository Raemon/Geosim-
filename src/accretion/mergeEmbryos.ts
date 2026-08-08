import { emptySpeciesAmounts, type SpeciesAmounts } from '../disk/condensateSpecies';
import type { RandomStream } from '../random/mulberry32';
import type { Embryo } from './embryoSeeding';
import { hillRadiusAu, separationInMutualHillRadii } from './oligarchicGrowth';

const STABLE_SEPARATION_RANGE_HILL_RADII = [26, 40] as const;
const COMPARABLE_MASS_RATIO = 10;
const CHAOTIC_ZONE_HILL_RADII = 3.5;
const MAXIMUM_ROUNDS = 40;

export interface AccretionOutcome {
  survivors: Embryo[];
  ejectedMassKg: number;
}

export function mergeUntilOrbitsAreStable(
  embryos: readonly Embryo[],
  starMassKg: number,
  random: RandomStream,
): AccretionOutcome {
  const threshold = random.between(...STABLE_SEPARATION_RANGE_HILL_RADII);
  const outcome: AccretionOutcome = { survivors: orderedByOrbit(embryos), ejectedMassKg: 0 };
  for (let round = 0; round < MAXIMUM_ROUNDS; round++) {
    const next = oneRoundOfEncounters(outcome.survivors, starMassKg, threshold);
    outcome.ejectedMassKg += next.ejectedMassKg;
    if (next.survivors.length === outcome.survivors.length) return { ...outcome, survivors: next.survivors };
    outcome.survivors = next.survivors;
  }
  return outcome;
}

function orderedByOrbit(embryos: readonly Embryo[]): Embryo[] {
  return [...embryos].sort((a, b) => a.semiMajorAxisAu - b.semiMajorAxisAu);
}

function oneRoundOfEncounters(
  embryos: readonly Embryo[],
  starMassKg: number,
  threshold: number,
): AccretionOutcome {
  const outcome: AccretionOutcome = { survivors: [], ejectedMassKg: 0 };
  let index = 0;
  while (index < embryos.length) {
    const consumed = resolveEncounter(embryos, index, starMassKg, threshold, outcome);
    index += consumed;
  }
  return outcome;
}

function resolveEncounter(
  embryos: readonly Embryo[],
  index: number,
  starMassKg: number,
  threshold: number,
  outcome: AccretionOutcome,
): number {
  const inner = embryos[index]!;
  const outer = embryos[index + 1];
  if (outer === undefined) {
    outcome.survivors.push(inner);
    return 1;
  }
  if (accretesOnContact(inner, outer, starMassKg, threshold)) {
    outcome.survivors.push(mergedEmbryo(inner, outer));
    return 2;
  }
  if (fallsInsideChaoticZone(inner, outer, starMassKg)) {
    outcome.survivors.push(inner.massKg > outer.massKg ? inner : outer);
    outcome.ejectedMassKg += Math.min(inner.massKg, outer.massKg);
    return 2;
  }
  outcome.survivors.push(inner);
  return 1;
}

function accretesOnContact(
  inner: Embryo,
  outer: Embryo,
  starMassKg: number,
  threshold: number,
): boolean {
  if (massRatioOf(inner, outer) > COMPARABLE_MASS_RATIO) return false;
  return separationInMutualHillRadii(
    inner.massKg,
    outer.massKg,
    inner.semiMajorAxisAu,
    outer.semiMajorAxisAu,
    starMassKg,
  ) < threshold;
}

function fallsInsideChaoticZone(inner: Embryo, outer: Embryo, starMassKg: number): boolean {
  const dominant = inner.massKg > outer.massKg ? inner : outer;
  const zone = CHAOTIC_ZONE_HILL_RADII
    * hillRadiusAu(dominant.massKg, dominant.semiMajorAxisAu, starMassKg);
  return Math.abs(outer.semiMajorAxisAu - inner.semiMajorAxisAu) < zone;
}

function massRatioOf(inner: Embryo, outer: Embryo): number {
  return Math.max(inner.massKg, outer.massKg) / Math.max(1, Math.min(inner.massKg, outer.massKg));
}

function mergedEmbryo(inner: Embryo, outer: Embryo): Embryo {
  const massKg = inner.massKg + outer.massKg;
  return {
    massKg,
    semiMajorAxisAu: axisConservingAngularMomentum(inner, outer, massKg),
    species: summedSpecies(inner.species, outer.species),
  };
}

function axisConservingAngularMomentum(inner: Embryo, outer: Embryo, massKg: number): number {
  const momentum = inner.massKg * Math.sqrt(inner.semiMajorAxisAu)
    + outer.massKg * Math.sqrt(outer.semiMajorAxisAu);
  return Math.pow(momentum / massKg, 2);
}

function summedSpecies(left: SpeciesAmounts, right: SpeciesAmounts): SpeciesAmounts {
  const summed = emptySpeciesAmounts();
  for (const id of Object.keys(summed)) summed[id] = (left[id] ?? 0) + (right[id] ?? 0);
  return summed;
}
