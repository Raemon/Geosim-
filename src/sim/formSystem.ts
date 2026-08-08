import { collapseCloud } from '../cloud/collapse';
import { molecularCloudFromSeed, type MolecularCloud } from '../cloud/molecularCloud';
import { logarithmicRadialGrid, type RadialGrid } from '../disk/radialGrid';
import { radiusWhereTemperatureFallsBelow, snowLineAu } from '../disk/snowLine';
import { diskSolids, type DiskSolids } from '../disk/solidComposition';
import { captureEnvelopes, type Planet } from '../accretion/gasCapture';
import { condensateById } from '../disk/condensateSpecies';
import { seedEmbryos } from '../accretion/embryoSeeding';
import { mergeUntilOrbitsAreStable } from '../accretion/mergeEmbryos';
import { streamFor } from '../random/mulberry32';
import { luminositySolarAt } from '../star/luminosityOverTime';
import { starOfMass, type Star } from '../star/mainSequence';

export interface FormedSystem {
  seed: number;
  cloud: MolecularCloud;
  star: Star;
  grid: RadialGrid;
  solids: DiskSolids;
  snowLineAu: number;
  hydrationRadiusAu: number;
  planets: Planet[];
  ejectedMassKg: number;
}

const RADIAL_CELL_COUNT = 300;
const PLANETESIMAL_EPOCH_MYR = 1.5;

export function formSystem(seed: number): FormedSystem {
  const cloud = molecularCloudFromSeed(seed);
  const collapsed = collapseCloud(cloud, seed);
  const star = starOfMass(collapsed.starMassKg);
  const luminositySolar = luminositySolarAt(star, PLANETESIMAL_EPOCH_MYR);
  const grid = logarithmicRadialGrid(collapsed.diskOuterRadiusAu, RADIAL_CELL_COUNT);
  const solids = diskSolids({
    grid,
    diskMassKg: collapsed.diskMassKg,
    diskOuterRadiusAu: collapsed.diskOuterRadiusAu,
    luminositySolar,
    diskAgeMyr: PLANETESIMAL_EPOCH_MYR,
    elementMassFractions: cloud.elementMassFractions,
  });
  const snowLine = snowLineAu(luminositySolar, PLANETESIMAL_EPOCH_MYR);
  return {
    seed,
    cloud,
    star,
    grid,
    solids,
    snowLineAu: snowLine,
    hydrationRadiusAu: radiusWhereTemperatureFallsBelow(
      condensateById('serpentine').condensationK,
      luminositySolar,
      PLANETESIMAL_EPOCH_MYR,
    ),
    ...assemblePlanets(seed, grid, solids, collapsed.starMassKg, snowLine, collapsed.diskLifetimeMyr),
  };
}

function assemblePlanets(
  seed: number,
  grid: RadialGrid,
  solids: DiskSolids,
  starMassKg: number,
  snowLine: number,
  diskLifetimeMyr: number,
): { planets: Planet[]; ejectedMassKg: number } {
  const embryos = seedEmbryos(grid, solids, starMassKg, snowLine);
  const outcome = mergeUntilOrbitsAreStable(embryos, starMassKg, streamFor(seed, 'giant impacts'));
  return {
    planets: captureEnvelopes(outcome.survivors, starMassKg, snowLine, diskLifetimeMyr > PLANETESIMAL_EPOCH_MYR),
    ejectedMassKg: outcome.ejectedMassKg,
  };
}
