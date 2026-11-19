import { module, test } from 'qunit';
import {
  History,
  cutRange,
  duplicate,
  minimumPiece,
  move,
  placeAt,
  split,
  starts,
  total,
  trim,
  type Piece,
} from 'xsenze-tools/lib/video-edit/timeline';

const piece = (id: string, clip: string, a: number, b: number): Piece => ({
  id,
  clip,
  in: a,
  out: b,
  volume: 1,
  muted: false,
});

// clip A 0–10 s, clip B 2–6 s: 14 s in all
const edit = () => [piece('a', 'A', 0, 10), piece('b', 'B', 2, 6)];
const spans = (pieces: Piece[]) =>
  pieces.map((p) => `${p.clip}:${+p.in.toFixed(3)}-${+p.out.toFixed(3)}`);

module('Unit | video edit | timeline', function () {
  test('total, starts and placeAt', function (assert) {
    const pieces = edit();
    assert.strictEqual(total(pieces), 14);
    assert.deepEqual(starts(pieces), [0, 10]);
    assert.strictEqual(placeAt(pieces, 3)?.clipTime, 3);
    // a join belongs to the piece after it
    assert.strictEqual(placeAt(pieces, 10)?.index, 1);
    assert.strictEqual(placeAt(pieces, 12)?.clipTime, 4);
    assert.strictEqual(placeAt(pieces, 99)?.clipTime, 6, 'the end clamps');
    assert.strictEqual(placeAt([], 1), null);
  });

  test('split cuts the piece under the playhead', function (assert) {
    const pieces = split(edit(), 4);
    assert.deepEqual(spans(pieces), ['A:0-4', 'A:4-10', 'B:2-6']);
    assert.notStrictEqual(pieces[0]!.id, pieces[1]!.id);
    assert.deepEqual(
      spans(split(edit(), minimumPiece / 2)),
      ['A:0-10', 'B:2-6'],
      'too near an edge: no cut',
    );
  });

  test('cutRange removes a middle part and closes up', function (assert) {
    // 8–12 s: the last 2 s of A and the first 2 s of B
    assert.deepEqual(spans(cutRange(edit(), 8, 12)), ['A:0-8', 'B:4-6']);
    // inside one piece: it becomes two
    assert.deepEqual(spans(cutRange(edit(), 3, 5)), [
      'A:0-3',
      'A:5-10',
      'B:2-6',
    ]);
    assert.strictEqual(total(cutRange(edit(), 3, 5)), 12);
    // reversed bounds work the same
    assert.deepEqual(spans(cutRange(edit(), 12, 8)), ['A:0-8', 'B:4-6']);
    // the whole of B
    assert.deepEqual(spans(cutRange(edit(), 10, 14)), ['A:0-10']);
  });

  test('move, duplicate and trim', function (assert) {
    assert.deepEqual(spans(move(edit(), 'b', 0)), ['B:2-6', 'A:0-10']);
    assert.deepEqual(spans(move(edit(), 'a', 9)), ['B:2-6', 'A:0-10']);
    assert.deepEqual(spans(duplicate(edit(), 'a')), [
      'A:0-10',
      'A:0-10',
      'B:2-6',
    ]);
    assert.deepEqual(spans(trim(edit(), 'b', 1, 5, 8)), ['A:0-10', 'B:1-5']);
    assert.deepEqual(
      spans(trim(edit(), 'b', -3, 20, 8)),
      ['A:0-10', 'B:0-8'],
      'kept inside the clip',
    );
    const tooShort = trim(edit(), 'b', 2, 2.01, 8);
    assert.ok(tooShort[1]!.out - tooShort[1]!.in >= minimumPiece - 1e-9);
  });

  test('history undoes and redoes', function (assert) {
    const history = new History<Piece[]>();
    let pieces = edit();
    history.record(pieces);
    pieces = split(pieces, 4);
    history.record(pieces);
    pieces = cutRange(pieces, 0, 2);
    assert.strictEqual(total(pieces), 12);
    pieces = history.undo(pieces)!;
    assert.deepEqual(spans(pieces), ['A:0-4', 'A:4-10', 'B:2-6']);
    pieces = history.undo(pieces)!;
    assert.deepEqual(spans(pieces), ['A:0-10', 'B:2-6']);
    assert.false(history.canUndo);
    pieces = history.redo(pieces)!;
    assert.strictEqual(pieces.length, 3);
    history.record(pieces);
    assert.false(history.canRedo, 'a new change drops the redo list');
  });
});
