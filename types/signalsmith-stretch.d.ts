// signalsmith-stretch ships no types: the parts of its AudioNode we use.
declare module 'signalsmith-stretch' {
  interface StretchSchedule {
    /** Context time this change takes effect, in seconds. */
    output?: number;
    active?: boolean;
    /** Position in the input buffers, in seconds. */
    input?: number;
    /** Playback rate: 0.5 is half speed. Pitch is kept. */
    rate?: number;
    semitones?: number;
  }

  interface SignalsmithStretchNode extends AudioNode {
    /** Append one typed array per channel; resolves to the new input end time. */
    addBuffers(buffers: Float32Array[]): Promise<number>;
    schedule(change: StretchSchedule): void;
    start(when?: number): void;
    stop(when?: number): void;
    latency(): number;
  }

  export default function SignalsmithStretch(
    context: BaseAudioContext,
    options?: AudioWorkletNodeOptions,
  ): Promise<SignalsmithStretchNode>;
}
