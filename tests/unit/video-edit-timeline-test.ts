import { module, test } from 'qunit';
import {
  History,
  cutRangeAudio,
  editLength,
  emptyEdit,
  fadeAt,
  moveAudio,
  settle,
  splitAudio,
  trimAudio,
  type AudioItem,
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
} from 'xsenze-tools/lib/video/edit/timeline';

const piece = (id: string, clip: string, a: number, b: number): Piece => ({
  id,
  clip,
  in: a,
  out: b,
  volume: 1,
  muted: false,
  fadeIn: 0,
  fadeOut: 0,
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

  test('audio items keep their layer clear', function (assert) {
    const sound = (
      id: string,
      start: number,
      a: number,
      b: number,
    ): AudioItem => ({
      id,
      clip: 'S',
      lane: 'music',
      start,
      in: a,
      out: b,
      volume: 1,
      muted: false,
      fadeIn: 0,
      fadeOut: 0,
    });
    const items = [sound('m1', 0, 0, 4), sound('m2', 6, 0, 3)];
    // dropped over m1: it moves past it
    assert.strictEqual(settle(items, sound('x', 2, 0, 1)).start, 4);
    // a gap that is too short: past m2 too
    assert.strictEqual(settle(items, sound('x', 3, 0, 3)).start, 9);
    assert.strictEqual(moveAudio(items, 'm2', 1)[1]!.start, 4);
    assert.strictEqual(
      moveAudio(items, 'm2', 1, 'voice')[1]!.start,
      1,
      'another layer is free',
    );
    const split = splitAudio(items, 'm1', 1.5);
    assert.deepEqual(
      split.map((i) => [i.start, i.in, i.out]),
      [
        [0, 0, 1.5],
        [1.5, 1.5, 4],
        [6, 0, 3],
      ],
    );
    // the in point moves the start with it
    const trimmed = trimAudio(items, 'm2', 1, 3, 5)[1]!;
    assert.deepEqual([trimmed.start, trimmed.in, trimmed.out], [7, 1, 3]);
    // a cut on the timeline closes the gap on the layers too
    const cut = cutRangeAudio(items, 3, 5);
    assert.deepEqual(
      cut.map((i) => [i.start, i.in, i.out]),
      [
        [0, 0, 3],
        [4, 0, 3],
      ],
    );
  });

  test('length and fades', function (assert) {
    const edit = emptyEdit();
    edit.pieces = [piece('a', 'A', 0, 10)];
    assert.strictEqual(editLength(edit), 10);
    edit.audio = [
      {
        id: 'm',
        clip: 'S',
        lane: 'voice',
        start: 8,
        in: 0,
        out: 5,
        volume: 1,
        muted: false,
        fadeIn: 0,
        fadeOut: 0,
      },
    ];
    assert.strictEqual(
      editLength(edit),
      13,
      'a sound past the video lengthens the edit',
    );
    assert.strictEqual(fadeAt(0.5, 10, 1, 2), 0.5);
    assert.strictEqual(fadeAt(5, 10, 1, 2), 1);
    assert.strictEqual(fadeAt(9, 10, 1, 2), 0.5);
  });
});
