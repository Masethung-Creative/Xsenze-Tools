import { module, test } from 'qunit';
import {
  cleanText,
  paragraphs,
  parseAss,
  parseLrc,
  readCues,
  wordCount,
  writeCsv,
  writeMarkdown,
  writeText,
} from 'xsenze-tools/lib/subtitles/transcript';
import { pdfOfImages } from 'xsenze-tools/lib/subtitles/transcript-files';

const SRT = `1
00:00:01,000 --> 00:00:02,500
Hello <i>there</i>.

2
00:00:02,700 --> 00:00:04,000
[Music] How are you?

3
00:01:10,000 --> 00:01:12,000
Second part.
`;

const options = { gapMs: 2000, stamps: 'paragraph' as const, dropNotes: true };

module('Unit | transcript', function () {
  test('reads SRT and joins cues into paragraphs at pauses', function (assert) {
    const cues = readCues(SRT, 'talk.srt');
    assert.strictEqual(cues.length, 3);
    const paras = paragraphs(cues, options);
    assert.deepEqual(
      paras.map((p) => p.text),
      ['Hello there. How are you?', 'Second part.'],
    );
    assert.strictEqual(wordCount(paras), 7);
    assert.strictEqual(
      writeText(paras),
      '[00:00:01] Hello there. How are you?\n\n[00:01:10] Second part.\n',
    );
  });

  test('keeps sound notes when asked', function (assert) {
    assert.strictEqual(
      cleanText('[Music] Hi (laughs) ♪', false),
      '[Music] Hi (laughs) ♪',
    );
    assert.strictEqual(cleanText('[Music] Hi (laughs) ♪', true), 'Hi');
  });

  test('every-minute stamps show only when a minute starts', function (assert) {
    const cues = [0, 20_000, 40_000, 65_000].map((start) => ({
      start,
      end: start + 1000,
      text: 'Words.',
    }));
    const paras = paragraphs(cues, { ...options, stamps: 'minute' });
    assert.deepEqual(
      paras.map((p) => p.stamp),
      [true, false, false, true],
    );
    const off = paragraphs(cues, { ...options, stamps: 'off' });
    assert.notOk(off.some((p) => p.stamp));
  });

  test('reads ASS dialogue with commas in the text', function (assert) {
    const ass = `[Script Info]
Title: x

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:01.50,0:00:03.00,Default,,0,0,0,,{\\an8}One, two\\Nthree`;
    const cues = parseAss(ass);
    assert.deepEqual(cues, [
      { start: 1500, end: 3000, text: 'One, two\nthree' },
    ]);
  });

  test('reads LRC lines, each until the next', function (assert) {
    const cues = parseLrc(
      '[ar:Someone]\n[00:01.00]First\n[00:04.50]Second\n[00:06.00]',
    );
    assert.deepEqual(cues, [
      { start: 1000, end: 4500, text: 'First' },
      { start: 4500, end: 6000, text: 'Second' },
    ]);
  });

  test('markdown and CSV', function (assert) {
    const paras = paragraphs(readCues(SRT, 'a.srt'), options);
    assert.ok(
      writeMarkdown('Talk', paras).startsWith('# Talk\n\n**[00:00:01]** Hello'),
    );
    const csv = writeCsv(paras);
    assert.strictEqual(csv.charCodeAt(0), 0xfeff);
    assert.ok(csv.startsWith('Start,End,Text\r\n', 1));
    assert.ok(
      csv.includes('00:00:01.000,00:00:04.000,"Hello there. How are you?"'),
    );
  });

  test('the PDF has a matching cross-reference table', async function (assert) {
    const blob = pdfOfImages([new Uint8Array([1, 2, 3])], 10, 10);
    const text = new TextDecoder('latin1').decode(await blob.arrayBuffer());
    assert.ok(text.startsWith('%PDF-1.4'));
    const start = Number(/startxref\n(\d+)/.exec(text)![1]);
    assert.strictEqual(text.slice(start, start + 4), 'xref');
    assert.ok(text.includes('/Count 1'));
  });
});
