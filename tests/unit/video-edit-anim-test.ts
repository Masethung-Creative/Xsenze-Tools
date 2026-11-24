import { module, test } from 'qunit';
import { ANIM_IDS, isStill, motionOf } from 'xsenze-tools/lib/video/edit/anim';
import {
  split,
  pieceFor,
  type Clip,
} from 'xsenze-tools/lib/video/edit/timeline';

const W = 1280;
const H = 720;
// an item 4 s long, each animation 1 s
const at = (anim: (typeof ANIM_IDS)[number], local: number, out = false) =>
  out
    ? motionOf('none', anim, 1, local, 4, W, H)
    : motionOf(anim, 'none', 1, local, 4, W, H);

module('Unit | Video Edit | animations', function () {
  test('every animation is at rest in the middle and when done', function (assert) {
    for (const anim of ANIM_IDS) {
      assert.true(isStill(at(anim, 2)), `${anim} in the middle`);
      assert.true(isStill(at(anim, 1)), `${anim} once in`);
      assert.true(isStill(at(anim, 3, true)), `${anim} before going out`);
    }
  });

  test('coming in starts hidden, small, blurred or unrevealed', function (assert) {
    assert.strictEqual(at('fade', 0).alpha, 0, 'fade');
    assert.true(at('blur', 0.2).blur > 10, 'blur is soft at first');
    assert.true(at('zoom-in', 0.2).scale < 1, 'zoom in starts small');
    assert.true(at('zoom-out', 0.2).scale > 1, 'zoom out starts large');
    assert.true(at('slide-fade', 0.2).dx < 0, 'slide fade comes from the left');
    assert.strictEqual(at('soft-reveal', 0).reveal?.p, 0, 'soft reveal');
    assert.strictEqual(at('circle', 0).reveal?.kind, 'circle', 'circle');
    assert.true(at('circle', 0.5).reveal!.p > 0.5, 'circle half way');
    assert.strictEqual(at('typewriter', 0.5).typed, 0.5, 'typewriter');
  });

  test('going out carries on the way it is heading', function (assert) {
    assert.true(at('zoom-in', 3.8, true).scale > 1, 'zoom in keeps growing');
    assert.true(
      at('zoom-out', 3.8, true).scale < 1,
      'zoom out keeps shrinking',
    );
    assert.true(at('slide-fade', 3.8, true).dx > 0, 'slide fade goes right');
    assert.strictEqual(at('fade', 4, true).alpha, 0, 'faded out at the end');
  });

  test('a short item halves its animations', function (assert) {
    // 1 s long with 2 s animations: each takes half a second
    const m = motionOf('fade', 'fade', 2, 0.25, 1, W, H);
    assert.true(m.alpha > 0.5, `alpha ${m.alpha} past half`);
    assert.true(m.alpha < 1, `alpha ${m.alpha} not yet full`);
  });

  test('a cut keeps the coming in on the first part, the going out on the second', function (assert) {
    const clip = { id: 'c', kind: 'video', duration: 10 } as Clip;
    const piece = {
      ...pieceFor(clip),
      animIn: 'circle' as const,
      animOut: 'blur' as const,
    };
    const [first, second] = split([piece], 5);
    assert.strictEqual(first?.animIn, 'circle');
    assert.strictEqual(first?.animOut, 'none');
    assert.strictEqual(second?.animIn, 'none');
    assert.strictEqual(second?.animOut, 'blur');
  });
});
