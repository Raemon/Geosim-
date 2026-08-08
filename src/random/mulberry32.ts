export interface RandomStream {
  next(): number;
  between(low: number, high: number): number;
  normal(mean: number, deviation: number): number;
}

export function mulberry32(seed: number): RandomStream {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    between: (low, high) => low + (high - low) * next(),
    normal: (mean, deviation) => mean + deviation * boxMuller(next),
  };
}

function boxMuller(next: () => number): number {
  const magnitude = Math.sqrt(-2 * Math.log(1 - next()));
  return magnitude * Math.cos(2 * Math.PI * next());
}

export function streamFor(seed: number, label: string): RandomStream {
  return mulberry32(hashLabel(seed, label));
}

function hashLabel(seed: number, label: string): number {
  let hash = seed >>> 0;
  for (let index = 0; index < label.length; index++) {
    hash = Math.imul(hash ^ label.charCodeAt(index), 0x01000193) >>> 0;
  }
  return hash;
}
