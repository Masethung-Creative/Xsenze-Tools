import { module, test } from 'qunit';
import { denoise } from 'xsenze-tools/lib/audio/denoise';
import {
  duckAt,
  duckRamp,
  emptyEdit,
  laneFree,
  type AudioItem,
  type Edit,
} from 'xsenze-tools/lib/video/edit/timeline';

const item = (
  id: string,
  lane: AudioItem['lane'],
  start: number,
  length: number,
): AudioItem => ({
  id,
  clip: 'c',
  lane,
  start,
  in: 0,
  out: length,
  volume: 1,
  muted: false,
  fadeIn: 0,
  fadeOut: 0,
});

const rms = (data: Float32Array, from: number, to: number) => {
  let sum = 0;
  for (let i = from; i < to; i++) sum += data[i]! * data[i]!;
  return Math.sqrt(sum / (to - from));
};

module('Unit | video edit | sound', function () {
  test('the music ducks under the voice, easing in and out', function (assert) {
    // a voice from 2 s to 4 s
    const edit: Edit = {
      ...emptyEdit(),
      audio: [item('m', 'music', 0, 10), item('v', 'voice', 2, 2)],
    };
    const level = edit.mix.duck.level;
    assert.strictEqual(duckAt(edit, 0.5), 1, 'no voice: full level');
    assert.ok(Math.abs(duckAt(edit, 3) - level) < 1e-9, 'under the voice');
    const halfway = duckAt(edit, 2 - duckRamp / 2);
    assert.ok(halfway < 1, 'easing down before it');
    assert.ok(halfway > level, 'not yet all the way down');
    assert.strictEqual(duckAt(edit, 4 + duckRamp + 0.01), 1, 'back after');
    const off = { ...edit, mix: { ...edit.mix, duck: { on: false, level } } };
    assert.strictEqual(duckAt(off, 3), 1, 'switched off');
    const muted = {
      ...edit,
      mix: { ...edit.mix, voice: { volume: 1, muted: true } },
    };
    assert.strictEqual(
      duckAt(muted, 3),
      1,
      'a muted Voice layer does not duck',
    );
  });

  test('laneFree finds room on a layer', function (assert) {
    const items = [item('a', 'voice', 2, 2)];
    assert.true(laneFree(items, 'voice', 0, 2), 'up to its start');
    assert.false(laneFree(items, 'voice', 3, 2), 'overlapping');
    assert.true(laneFree(items, 'music', 3, 2), 'another layer');
  });

  test('denoise takes down steady noise and keeps a louder tone', async function (assert) {
    const rate = 16000;
    const length = rate * 2;
    const buffer = new AudioBuffer({
      numberOfChannels: 1,
      length,
      sampleRate: rate,
    });
    const data = new Float32Array(length);
    let seed = 7;
    const noise = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed / 2147483647 - 0.5) * 0.1;
    };
    for (let i = 0; i < length; i++) {
      // noise throughout, a tone in the second second
      const tone =
        i >= rate ? 0.4 * Math.sin((2 * Math.PI * 440 * i) / rate) : 0;
      data[i] = noise() + tone;
    }
    buffer.copyToChannel(data, 0);
    const out = (await denoise(buffer, 1)).getChannelData(0);
    const noiseBefore = rms(data, 2000, rate - 2000);
    const noiseAfter = rms(out, 2000, rate - 2000);
    const toneBefore = rms(data, rate + 2000, length - 2000);
    const toneAfter = rms(out, rate + 2000, length - 2000);
    assert.ok(
      noiseAfter < noiseBefore * 0.3,
      `noise falls: ${noiseBefore.toFixed(4)} to ${noiseAfter.toFixed(4)}`,
    );
    assert.ok(
      toneAfter > toneBefore * 0.85,
      `the tone stays: ${toneBefore.toFixed(4)} to ${toneAfter.toFixed(4)}`,
    );
  });
});
