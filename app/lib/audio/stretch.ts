/**
 * Speeds sound up or slows it down with its pitch kept (Signalsmith
 * Stretch), every channel together. Loaded only when used.
 */

/** Silence fed before the sound so the stretcher has settled, seconds. */
const lead = 0.1;

/** The sound at `rate` times its speed: 2 is half as long. */
export async function stretchBuffer(
  buffer: AudioBuffer,
  rate: number,
): Promise<AudioBuffer> {
  if (Math.abs(rate - 1) < 0.01) return buffer;
  const { default: SignalsmithStretch } = await import('signalsmith-stretch');
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const leadFrames = Math.round(lead * sampleRate);
  const inputs = Array.from({ length: channels }, (_, c) => {
    const input = new Float32Array(leadFrames + buffer.length);
    input.set(buffer.getChannelData(c), leadFrames);
    return input;
  });
  const frames =
    Math.ceil((leadFrames + buffer.length) / rate) +
    Math.round(0.1 * sampleRate);
  const context = new OfflineAudioContext(channels, frames, sampleRate);
  const node = await SignalsmithStretch(context, {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [channels],
  });
  await node.addBuffers(inputs);
  node.schedule({ active: true, input: 0, output: 0, rate });
  node.connect(context.destination);
  const rendered = await context.startRendering();
  const from = Math.round(leadFrames / rate);
  const length = Math.max(1, Math.round(buffer.length / rate));
  const out = new AudioBuffer({
    numberOfChannels: channels,
    length,
    sampleRate,
  });
  for (let c = 0; c < channels; c++)
    out.copyToChannel(rendered.getChannelData(c).slice(from, from + length), c);
  return out;
}
