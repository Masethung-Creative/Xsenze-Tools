import { tracked } from '@glimmer/tracking';
import { audioContext, type WaveformPeaks } from 'xsenze-tools/lib/audio';

/** Seconds of audio behind each captured peak. */
export const peakInterval = 0.02;

export type CaptureState = 'idle' | 'recording' | 'paused';

/**
 * The live side of a recording: the clock, the input level and one peak per
 * `peakInterval`, read from a stream while it records. The caller owns the
 * stream and whatever encodes it; this only listens.
 */
export class Capture {
  @tracked state: CaptureState = 'idle';
  /** Seconds recorded, pauses left out. */
  @tracked elapsed = 0;
  /** Read per frame by the band; not tracked. */
  peaks: number[] = [];
  /** 0 to 1, the newest frame's peak; not tracked. */
  level = 0;

  #source?: MediaStreamAudioSourceNode;
  #analyser?: AnalyserNode;
  #data?: Float32Array<ArrayBuffer>;
  #frame = 0;
  #started = 0;
  #pausedAt = 0;

  get active() {
    return this.state !== 'idle';
  }

  /** Starts the clock; a stream with no audio track records a flat line. */
  start(stream: MediaStream) {
    this.#release();
    this.peaks = [];
    this.elapsed = 0;
    this.level = 0;
    if (stream.getAudioTracks().length) {
      const context = audioContext();
      void context.resume();
      this.#source = context.createMediaStreamSource(stream);
      this.#analyser = context.createAnalyser();
      this.#analyser.fftSize = 2048;
      this.#data = new Float32Array(this.#analyser.fftSize);
      this.#source.connect(this.#analyser);
    }
    this.#started = performance.now();
    this.state = 'recording';
    this.#tick();
  }

  pause() {
    if (this.state !== 'recording') return;
    cancelAnimationFrame(this.#frame);
    this.#pausedAt = performance.now();
    this.level = 0;
    this.state = 'paused';
  }

  resume() {
    if (this.state !== 'paused') return;
    this.#started += performance.now() - this.#pausedAt;
    this.state = 'recording';
    this.#tick();
  }

  /** Ends the take and hands back its peaks and length. */
  stop() {
    const take = { peaks: this.peaks, duration: this.elapsed };
    this.#release();
    this.level = 0;
    this.state = 'idle';
    return take;
  }

  #release() {
    cancelAnimationFrame(this.#frame);
    this.#source?.disconnect();
    this.#source = undefined;
    this.#analyser = undefined;
    this.#data = undefined;
  }

  // ponytail: one analyser window per frame spread over the 20 ms peaks it spans; an AudioWorklet if exact peaks matter
  #tick = () => {
    this.elapsed = (performance.now() - this.#started) / 1000;
    let peak = 0;
    if (this.#analyser && this.#data) {
      this.#analyser.getFloatTimeDomainData(this.#data);
      for (const value of this.#data) peak = Math.max(peak, Math.abs(value));
    }
    this.level = Math.min(1, peak);
    const due = Math.floor(this.elapsed / peakInterval);
    while (this.peaks.length < due) this.peaks.push(this.level);
    this.#frame = requestAnimationFrame(this.#tick);
  };
}

/** Peaks folded to at most `buckets` columns, mirrored, for a whole-take waveform. */
export function overview(peaks: number[], buckets: number): WaveformPeaks {
  const count = Math.max(1, Math.min(buckets, peaks.length));
  const min = new Float32Array(count);
  const max = new Float32Array(count);
  for (let index = 0; index < count; index++) {
    const from = Math.floor((index * peaks.length) / count);
    const to = Math.max(
      from + 1,
      Math.floor(((index + 1) * peaks.length) / count),
    );
    let peak = 0;
    for (let at = from; at < to && at < peaks.length; at++)
      peak = Math.max(peak, peaks[at]!);
    min[index] = -peak;
    max[index] = peak;
  }
  return { min, max };
}

export interface StripLayout {
  /** Canvas units per peak column. */
  step: number;
  /** Where the head sits, in canvas units. */
  head: number;
  /** First peak drawn. */
  from: number;
  /** The peak under the head: what is behind it is lit, what is ahead dimmed. */
  index: number;
  /** Peaks drawn past the head. */
  to: number;
  /** Canvas units the columns slide by between two peaks. */
  slip: number;
}

/**
 * Which peaks a strip of `width` shows at `position` seconds. Running: the
 * take slides under a head at three quarters of the width, two units per
 * peak. Fitted (reduced motion): the whole take spans
 * the width and the head moves.
 */
export function stripLayout(
  count: number,
  position: number,
  width: number,
  unit: number,
  fitted: boolean,
): StripLayout {
  const exact = Math.max(0, position / peakInterval);
  const index = Math.min(Math.floor(exact), count);
  if (fitted) {
    const step = width / Math.max(1, count);
    return {
      step,
      head: index * step,
      from: 0,
      index,
      to: count,
      slip: 0,
    };
  }
  const step = 2 * unit;
  const head = Math.round(width * 0.75);
  const room = Math.ceil(width / step) + 2;
  return {
    step,
    head,
    from: Math.max(0, index - Math.ceil(room * 0.75)),
    index,
    to: Math.min(count, index + room),
    slip: Math.round(Math.min(1, exact - index) * step),
  };
}
