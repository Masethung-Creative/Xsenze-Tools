import { module, test } from 'qunit';
import { keyPixels } from 'xsenze-tools/lib/video/edit/chroma';
import { movedBox } from 'xsenze-tools/lib/video/edit/draw';
import { packProject, unpackProject } from 'xsenze-tools/lib/video/edit/store';
import {
  emptyEdit,
  fullLook,
  plainKey,
  plainLook,
  type Edit,
} from 'xsenze-tools/lib/video/edit/timeline';

const pixels = (...colours: [number, number, number][]) =>
  new Uint8ClampedArray(colours.flatMap(([r, g, b]) => [r, g, b, 255]));

module('Unit | Video Edit | effects', function () {
  test('a green screen goes, a face and a white shirt stay', function (assert) {
    const data = pixels(
      [0, 177, 64],
      [20, 200, 70],
      [220, 170, 140],
      [250, 250, 250],
    );
    keyPixels(data, { ...plainKey(), on: true });
    assert.strictEqual(data[3], 0, 'the key colour is see-through');
    assert.strictEqual(data[7], 0, 'a lighter green is too');
    assert.strictEqual(data[11], 255, 'skin stays');
    assert.strictEqual(data[15], 255, 'white stays');
  });

  test('a soft edge is part see-through, with its green toned down', function (assert) {
    const data = pixels([50, 170, 70]);
    keyPixels(data, { ...plainKey(), on: true, range: 0.2, soft: 1 });
    assert.ok(data[3]! > 0, `alpha ${data[3]} is above 0`);
    assert.ok(data[3]! < 255, `alpha ${data[3]} is below 255`);
    assert.ok(data[1]! <= Math.max(data[0]!, data[2]!), 'no green glow');
  });

  test('a zoom grows the box about its middle; a pan stays inside the picture', function (assert) {
    const box = { x: 0, y: 0, w: 100, h: 50 };
    const zoom = { kind: 'in' as const, amount: 0.2 };
    assert.deepEqual(movedBox(box, zoom, 0), box, 'a zoom in starts as is');
    const end = movedBox(box, zoom, 1);
    assert.strictEqual(Math.round(end.w), 120);
    assert.strictEqual(Math.round(end.x), -10);
    const pan = { kind: 'left' as const, amount: 0.2 };
    for (const p of [0, 0.5, 1]) {
      const moved = movedBox(box, pan, p);
      assert.ok(moved.x <= 0.001, `left edge covered at ${p}`);
      assert.ok(moved.x + moved.w >= 99.999, `right edge covered at ${p}`);
    }
    assert.ok(
      movedBox(box, pan, 1).x < movedBox(box, pan, 0).x,
      'it moves to the left',
    );
  });

  test('older looks get the new effects, switched off', function (assert) {
    const old = { ...plainLook() } as Partial<ReturnType<typeof plainLook>>;
    delete old.vignette;
    delete old.motion;
    const look = fullLook(old);
    assert.strictEqual(look.vignette, 0);
    assert.strictEqual(look.motion.kind, 'none');
  });

  test('a project file opens back to the same edit and files', async function (assert) {
    const file = new File(['not really a video'], 'Beach: day 1.mp4', {
      type: 'video/mp4',
    });
    const edit: Edit = emptyEdit();
    const blob = await packProject(
      {
        version: 1,
        clips: [
          {
            id: 'c1',
            kind: 'video',
            name: file.name,
            duration: 3,
            width: 640,
            height: 360,
            fps: 30,
            hasAudio: true,
          },
        ],
        edit,
        settings: { formatIndex: 1 },
        savedAt: 1,
      },
      new Map([['c1', file]]),
    );
    const { saved, files } = await unpackProject(blob);
    assert.strictEqual(saved.clips.length, 1);
    assert.strictEqual(saved.settings['formatIndex'], 1);
    const back = files.get('c1');
    assert.strictEqual(back?.name, 'Beach: day 1.mp4');
    assert.strictEqual(back?.type, 'video/mp4');
    assert.strictEqual(await back?.text(), 'not really a video');
    await assert.rejects(
      unpackProject(new Blob(['hello'])),
      'a file that is not a project is refused',
    );
  });
});
