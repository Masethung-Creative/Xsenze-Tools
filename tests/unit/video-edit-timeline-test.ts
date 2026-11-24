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
  plainLook,
  noTransition,
  overlapOf,
  showingAt,
  textLayer,
  layerRows,
  layerSeconds,
  layersAt,
  trimLayer,
  splitLayer,
  cutRangeLayers,
  split,
  starts,
  total,
  trim,
  type Piece,
  type Layer,
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
  speed: 1,
  look: plainLook(),
  transition: noTransition(),
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

  test('speed changes how long a piece lasts and where it is cut', function (assert) {
    // A plays twice as fast: 10 s of clip in 5 s
    const pieces = [
      { ...piece('a', 'A', 0, 10), speed: 2 },
      piece('b', 'B', 2, 6),
    ];
    assert.strictEqual(total(pieces), 9);
    assert.strictEqual(
      placeAt(pieces, 2)?.clipTime,
      4,
      '2 s in is 4 s of clip',
    );
    assert.deepEqual(spans(split(pieces, 2)), ['A:0-4', 'A:4-10', 'B:2-6']);
    // cutting timeline 1–3 s removes clip 2–6 s of A
    assert.deepEqual(spans(cutRange(pieces, 1, 3)), [
      'A:0-2',
      'A:6-10',
      'B:2-6',
    ]);
  });

  test('a transition overlaps the piece before it', function (assert) {
    const pieces = edit();
    pieces[1] = { ...pieces[1]!, transition: { kind: 'dissolve', seconds: 1 } };
    assert.strictEqual(overlapOf(pieces, 1), 1);
    assert.deepEqual(starts(pieces), [0, 9]);
    assert.strictEqual(total(pieces), 13, 'one second shorter');
    const mid = showingAt(pieces, 9.5);
    assert.strictEqual(mid?.a.index, 0);
    assert.strictEqual(mid?.b?.index, 1);
    assert.strictEqual(mid?.p, 0.5);
    assert.strictEqual(mid?.b?.clipTime, 2.5);
    assert.strictEqual(showingAt(pieces, 5)?.b, null, 'no transition there');
    // kept under half of the shorter piece: B lasts 4 s
    pieces[1] = { ...pieces[1], transition: { kind: 'wipe', seconds: 9 } };
    assert.strictEqual(overlapOf(pieces, 1), 2);
    // a cut across the second piece's start drops its transition
    const cut = cutRange(pieces, 7.5, 8.5);
    assert.deepEqual(
      cut.map((p) => p.transition.kind),
      ['none', 'none', 'none'],
    );
  });

  test('layers: rows, trims, splits and cuts', function (assert) {
    const title = { ...textLayer('title', 1), id: 't1' };
    const caption = { ...textLayer('caption', 2), id: 't2' };
    const later = { ...textLayer('caption', 6), id: 't3' };
    const layers = [title, caption, later];
    const { rows, count } = layerRows(layers, 'text');
    assert.strictEqual(count, 2, 'the overlapping caption takes a second row');
    assert.deepEqual(
      [rows.get('t1'), rows.get('t2'), rows.get('t3')],
      [0, 1, 0],
    );
    assert.strictEqual(
      editLength({ ...emptyEdit(), layers }),
      6 + layerSeconds,
      'the edit lasts until the last layer ends',
    );
    assert.deepEqual(
      layersAt(layers, 2.5).map((l) => l.id),
      ['t1', 't2'],
    );
    // a video overlay's first frame moves with its start, inside its clip
    const pip: Layer = {
      ...textLayer('title', 2),
      id: 'v',
      kind: 'video',
      in: 1,
      length: 3,
    };
    const [early] = trimLayer([pip], 'v', 0, 5, 10);
    assert.deepEqual([early!.start, early!.in, early!.length], [1, 0, 4]);
    const [long] = trimLayer([pip], 'v', 2, 20, 10);
    assert.strictEqual(long!.length, 9, 'stops at the end of its clip');
    const halves = splitLayer([pip], 'v', 3);
    assert.deepEqual(
      halves.map((l) => [l.start, l.length, l.in]),
      [
        [2, 1, 1],
        [3, 2, 2],
      ],
    );
    // cutting 3–4 s: the title (1–5) loses a second, the last one moves up
    const cut = cutRangeLayers(layers, 3, 4);
    assert.deepEqual(
      cut.map((l) => [l.start, l.length]),
      [
        [1, 3],
        [2, 3],
        [5, 4],
      ],
    );
  });
});
