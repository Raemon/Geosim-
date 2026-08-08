const CARBON_DIOXIDE_FORCING_K_PER_DOUBLING = 4;
const REFERENCE_PARTIAL_PRESSURE_BAR = 3e-4;
const WATER_VAPOUR_AMPLIFICATION = 1.6;
const MAXIMUM_GREENHOUSE_K = 160;

export function greenhouseWarmingK(
  carbonDioxidePartialPressureBar: number,
  liquidWaterPresent: boolean,
): number {
  const doublings = Math.log2(
    Math.max(carbonDioxidePartialPressureBar, 1e-9) / REFERENCE_PARTIAL_PRESSURE_BAR,
  );
  const dry = Math.max(0, 33 + CARBON_DIOXIDE_FORCING_K_PER_DOUBLING * doublings);
  const amplified = liquidWaterPresent ? dry * WATER_VAPOUR_AMPLIFICATION : dry;
  return Math.min(MAXIMUM_GREENHOUSE_K, amplified);
}

export function partialPressureBar(
  gasMassKg: number,
  surfaceGravityMS2: number,
  planetRadiusM: number,
): number {
  const areaM2 = 4 * Math.PI * planetRadiusM * planetRadiusM;
  return (gasMassKg * surfaceGravityMS2) / areaM2 / 1e5;
}
