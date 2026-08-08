import type { PlanetSurface } from '../sim/stepPlanet';
import { isContinental } from '../tectonics/crustState';

export interface SurfaceAreaFractions {
  continental: number;
  submerged: number;
}

export function surfaceAreaFractions(surface: PlanetSurface): SurfaceAreaFractions {
  let continental = 0;
  let submerged = 0;
  for (let cell = 0; cell < surface.grid.cellCount; cell++) {
    const area = surface.grid.areaFraction[cell]!;
    if (isContinental(surface.crust, cell)) continental += area;
    if (surface.crust.elevationM[cell]! < surface.seaLevelM) submerged += area;
  }
  return { continental, submerged };
}
