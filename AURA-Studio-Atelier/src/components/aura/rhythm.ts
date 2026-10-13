export type RhythmState = {
  floor: number;
  previous: number;
  lastBeat: number;
  lastActivity: number;
  count: number;
  envelope: number;
  intervals: number[];
  bpm: number | null;
};

export function createRhythmState(): RhythmState {
  return {
    floor: 0.06,
    previous: 0,
    lastBeat: -10,
    lastActivity: 0,
    count: 0,
    envelope: 0,
    intervals: [],
    bpm: null,
  };
}

// Estimates tempo from repeated low-frequency onsets, rather than a visual timer.
// Sparse or irregular music deliberately has no tempo reading.
export function updateRhythm(
  state: RhythmState,
  low: number,
  now: number,
  dt: number,
  live: boolean,
): boolean {
  state.envelope *= Math.exp(-dt * 6);
  if (!live) {
    state.bpm = null;
    state.intervals.length = 0;
    state.previous = 0;
    state.lastBeat = -10;
    state.floor = 0.06;
    return false;
  }
  const rise = low - state.previous;
  const onset =
    rise > 0.035 && low > Math.max(0.09, state.floor * 1.18) && now - state.lastBeat > 0.28;
  state.previous = low;
  state.floor += (low - state.floor) * (1 - Math.exp(-dt * 1.8));
  if (low > 0.04) state.lastActivity = now;
  if (now - state.lastBeat > 3 || now - state.lastActivity > 1) {
    state.bpm = null;
    state.intervals.length = 0;
  }
  if (!onset) return false;
  const interval = now - state.lastBeat;
  state.lastBeat = now;
  state.count += 1;
  state.envelope = 1;
  if (interval > 0.28 && interval < 1.5) {
    state.intervals.push(interval);
    if (state.intervals.length > 10) state.intervals.shift();
  }
  if (state.intervals.length >= 4) {
    const sorted = [...state.intervals].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
    const consistent = sorted.filter((value) => Math.abs(value - median) < median * 0.18);
    if (consistent.length >= Math.ceil(sorted.length * 0.7)) {
      const average = consistent.reduce((a, b) => a + b, 0) / consistent.length;
      state.bpm = Math.round(60 / average);
    } else state.bpm = null;
  }
  return true;
}
