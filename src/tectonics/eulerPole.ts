import type { RandomStream } from '../random/mulberry32';

export interface EulerPoles {
  axisX: Float64Array;
  axisY: Float64Array;
  axisZ: Float64Array;
  angularSpeedRadPerMyr: Float64Array;
}

const ANGULAR_SPEED_RANGE_RAD_PER_MYR = [1.5e-3, 1.6e-2] as const;

export function randomEulerPoles(plateCount: number, random: RandomStream): EulerPoles {
  const poles: EulerPoles = {
    axisX: new Float64Array(plateCount),
    axisY: new Float64Array(plateCount),
    axisZ: new Float64Array(plateCount),
    angularSpeedRadPerMyr: new Float64Array(plateCount),
  };
  for (let plate = 0; plate < plateCount; plate++) fillPole(poles, plate, random);
  return poles;
}

function fillPole(poles: EulerPoles, plate: number, random: RandomStream): void {
  const [x, y, z] = randomUnitVector(random);
  poles.axisX[plate] = x;
  poles.axisY[plate] = y;
  poles.axisZ[plate] = z;
  poles.angularSpeedRadPerMyr[plate] = random.between(...ANGULAR_SPEED_RANGE_RAD_PER_MYR);
}

function randomUnitVector(random: RandomStream): [number, number, number] {
  const z = random.between(-1, 1);
  const azimuth = random.between(0, 2 * Math.PI);
  const ring = Math.sqrt(Math.max(0, 1 - z * z));
  return [ring * Math.cos(azimuth), ring * Math.sin(azimuth), z];
}
