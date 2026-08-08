import { emptySpeciesAmounts, type SpeciesAmounts } from '../disk/condensateSpecies';
import type { RadialGrid } from '../disk/radialGrid';
import type { DiskSolids } from '../disk/solidComposition';
import { ASTRONOMICAL_UNIT_M } from '../units/constants';
import { FEEDING_ZONE_HILL_RADII, hillRadiusAu, isolationMassKg } from './oligarchicGrowth';

export interface Embryo {
  semiMajorAxisAu: number;
  massKg: number;
  species: SpeciesAmounts;
}

const PEBBLE_ACCRETION_BOOST_BEYOND_SNOW_LINE = 6;

export function seedEmbryos(
  grid: RadialGrid,
  solids: DiskSolids,
  starMassKg: number,
  snowLineAu: number,
): Embryo[] {
  const embryos: Embryo[] = [];
  let radiusAu = grid.radiusAu[0]!;
  while (radiusAu < grid.radiusAu[grid.cellCount - 1]!) {
    const embryo = embryoAt(grid, solids, starMassKg, snowLineAu, radiusAu);
    if (embryo.massKg > 0) embryos.push(embryo);
    radiusAu += spacingAu(embryo, radiusAu, starMassKg);
  }
  return embryos;
}

function spacingAu(embryo: Embryo, radiusAu: number, starMassKg: number): number {
  const spacing = FEEDING_ZONE_HILL_RADII * hillRadiusAu(embryo.massKg, radiusAu, starMassKg);
  return Math.max(spacing, radiusAu * 0.02);
}

function embryoAt(
  grid: RadialGrid,
  solids: DiskSolids,
  starMassKg: number,
  snowLineAu: number,
  radiusAu: number,
): Embryo {
  const cell = nearestCell(grid, radiusAu);
  const boost = radiusAu > snowLineAu ? PEBBLE_ACCRETION_BOOST_BEYOND_SNOW_LINE : 1;
  const surfaceDensity = solids.solidSurfaceDensityKgM2[cell]! * boost;
  const massKg = isolationMassKg(radiusAu, surfaceDensity, starMassKg);
  return {
    semiMajorAxisAu: radiusAu,
    massKg,
    species: scaledSpecies(solids.speciesAtRadius[cell]!, massKg),
  };
}

function scaledSpecies(fractions: SpeciesAmounts, massKg: number): SpeciesAmounts {
  const total = Object.values(fractions).reduce((sum, value) => sum + value, 0);
  const species = emptySpeciesAmounts();
  if (total <= 0) return species;
  for (const id of Object.keys(fractions)) species[id] = ((fractions[id] ?? 0) / total) * massKg;
  return species;
}

function nearestCell(grid: RadialGrid, radiusAu: number): number {
  for (let cell = 0; cell < grid.cellCount; cell++) {
    if (radiusAu < grid.outerEdgeAu[cell]!) return cell;
  }
  return grid.cellCount - 1;
}

export function totalEmbryoMassKg(embryos: readonly Embryo[]): number {
  return embryos.reduce((sum, embryo) => sum + embryo.massKg, 0);
}

export function orbitalPeriodYears(semiMajorAxisAu: number, starMassSolar: number): number {
  return Math.sqrt(Math.pow(semiMajorAxisAu, 3) / starMassSolar);
}

export function feedingZoneWidthM(embryo: Embryo, starMassKg: number): number {
  return FEEDING_ZONE_HILL_RADII
    * hillRadiusAu(embryo.massKg, embryo.semiMajorAxisAu, starMassKg)
    * ASTRONOMICAL_UNIT_M;
}
