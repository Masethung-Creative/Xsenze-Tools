// demucs-web ships no types: the pieces of its HTDemucs pre/post-processing we use.
declare module 'demucs-web' {
  export const CONSTANTS: {
    SAMPLE_RATE: number;
    FFT_SIZE: number;
    HOP_SIZE: number;
    /** Samples per model segment. */
    TRAINING_SAMPLES: number;
    MODEL_SPEC_BINS: number;
    MODEL_SPEC_FRAMES: number;
    SEGMENT_OVERLAP: number;
    TRACKS: string[];
  };

  export interface TrackSpec {
    leftReal: Float32Array;
    leftImag: Float32Array;
    rightReal: Float32Array;
    rightImag: Float32Array;
  }

  /** One segment's model inputs: the stereo waveform and its STFT (real/imag per channel). */
  export function prepareModelInput(
    left: Float32Array,
    right: Float32Array,
  ): {
    waveform: Float32Array;
    magSpec: Float32Array;
    numBins: number;
    numFrames: number;
    originalLength: number;
  };

  /** A stem's spectrum back to a stereo waveform of `length` samples. */
  export function standaloneIspec(
    spec: TrackSpec,
    length: number,
  ): { left: Float32Array; right: Float32Array };
}
