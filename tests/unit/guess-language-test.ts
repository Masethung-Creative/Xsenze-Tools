import { module, test } from 'qunit';
import { guessLanguage } from 'xsenze-tools/lib/subtitles/guess-language';
import { outputName } from 'xsenze-tools/components/tools/video/auto-subtitle/result';

const cues = (...lines: string[]) =>
  lines.map((text, i) => ({ start: i * 2000, end: i * 2000 + 1800, text }));

module('Unit | guess language', function () {
  test('tells languages apart by script', function (assert) {
    assert.strictEqual(
      guessLanguage(cues('வணக்கம், எப்படி இருக்கீங்க?', 'OK, நன்றி')),
      'ta',
    );
    assert.strictEqual(guessLanguage(cues('नमस्ते, आप कैसे हैं?')), 'hi');
    assert.strictEqual(guessLanguage(cues('こんにちは、元気ですか')), 'ja');
    assert.strictEqual(guessLanguage(cues('你好，你今天怎么样')), 'zh');
    assert.strictEqual(guessLanguage(cues('안녕하세요 잘 지내요')), 'ko');
    assert.strictEqual(guessLanguage(cues('Привет, как дела?')), 'ru');
    assert.strictEqual(guessLanguage(cues('مرحبا كيف حالك')), 'ar');
  });

  test('tells Latin-script languages apart by their common words', function (assert) {
    assert.strictEqual(
      guessLanguage(
        cues('What is this?', 'I think that the plan is good and it works.'),
      ),
      'en',
    );
    assert.strictEqual(
      guessLanguage(
        cues(
          'No sé que es esto.',
          'Pero el perro está en la casa con los niños.',
        ),
      ),
      'es',
    );
    assert.strictEqual(
      guessLanguage(
        cues('Je ne sais pas.', 'Nous avons les clés et vous êtes là.'),
      ),
      'fr',
    );
    assert.strictEqual(
      guessLanguage(cues('Ich weiß nicht.', 'Das ist der Hund und die Katze.')),
      'de',
    );
  });

  test('gives nothing when unsure', function (assert) {
    assert.strictEqual(guessLanguage([]), undefined);
    assert.strictEqual(guessLanguage(cues('[Music]', '♪')), undefined);
    assert.strictEqual(guessLanguage(cues('Okay')), undefined);
  });

  test('puts the language in the file name', function (assert) {
    assert.strictEqual(outputName('movie.mp4', 'srt', 'ta'), 'movie.ta.srt');
    assert.strictEqual(outputName('talk.mp3', 'vtt', 'en'), 'talk.en.vtt');
    assert.strictEqual(outputName('talk.mp3', 'txt'), 'talk.txt');
  });
});
