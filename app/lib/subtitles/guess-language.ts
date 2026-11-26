import type { Cue } from 'xsenze-tools/lib/subtitles/subtitles';

/*
 * A language code (ISO 639-1, as Whisper uses) guessed from subtitle text, for
 * file names such as movie.ta.srt. The script settles most languages; Latin text
 * is told apart by its most common words. Undefined when it is not clear.
 */

const SCRIPTS: [RegExp, string][] = [
  [/[஀-௿]/g, 'ta'],
  [/[ऀ-ॿ]/g, 'hi'],
  [/[ঀ-৿]/g, 'bn'],
  [/[਀-੿]/g, 'pa'],
  [/[઀-૿]/g, 'gu'],
  [/[ఀ-౿]/g, 'te'],
  [/[ಀ-೿]/g, 'kn'],
  [/[ഀ-ൿ]/g, 'ml'],
  [/[඀-෿]/g, 'si'],
  [/[฀-๿]/g, 'th'],
  [/[຀-໿]/g, 'lo'],
  [/[က-႟]/g, 'my'],
  [/[ក-៿]/g, 'km'],
  [/[ሀ-፿]/g, 'am'],
  [/[Ⴀ-ჿ]/g, 'ka'],
  [/[԰-֏]/g, 'hy'],
  [/[֐-׿]/g, 'he'],
  [/[؀-ۿݐ-ݿ]/g, 'ar'],
  [/[가-힯ᄀ-ᇿ]/g, 'ko'],
  [/[぀-ヿ]/g, 'ja'],
  [/[一-鿿]/g, 'zh'],
  [/[Ͱ-Ͽ]/g, 'el'],
  [/[Ѐ-ӿ]/g, 'ru'],
];

// the commonest short words of each Latin-script language
const WORDS: Record<string, string[]> = {
  en: [
    'the',
    'and',
    'is',
    'you',
    'that',
    'it',
    'of',
    'to',
    'what',
    'this',
    'with',
    'have',
  ],
  es: [
    'el',
    'la',
    'que',
    'y',
    'es',
    'los',
    'por',
    'con',
    'una',
    'pero',
    'muy',
    'está',
  ],
  fr: [
    'le',
    'la',
    'et',
    'est',
    'les',
    'je',
    'vous',
    'pas',
    'une',
    'que',
    'des',
    'nous',
  ],
  de: [
    'der',
    'die',
    'und',
    'ist',
    'das',
    'ich',
    'nicht',
    'sie',
    'ein',
    'mit',
    'auf',
    'wir',
  ],
  pt: [
    'o',
    'que',
    'não',
    'é',
    'um',
    'uma',
    'com',
    'para',
    'os',
    'você',
    'isso',
    'muito',
  ],
  it: [
    'il',
    'che',
    'è',
    'di',
    'non',
    'per',
    'una',
    'sono',
    'gli',
    'questo',
    'anche',
    'come',
  ],
  nl: [
    'het',
    'een',
    'niet',
    'dat',
    'ik',
    'je',
    'van',
    'wat',
    'maar',
    'zijn',
    'ook',
    'heb',
  ],
  id: [
    'yang',
    'dan',
    'ini',
    'itu',
    'tidak',
    'saya',
    'ada',
    'dengan',
    'untuk',
    'kita',
    'apa',
    'akan',
  ],
  tr: [
    'bir',
    've',
    'bu',
    'ne',
    'çok',
    'için',
    'ama',
    'ben',
    'değil',
    'var',
    'daha',
    'gibi',
  ],
  pl: [
    'nie',
    'się',
    'to',
    'jest',
    'że',
    'na',
    'jak',
    'ale',
    'co',
    'tak',
    'czy',
    'już',
  ],
  sv: [
    'och',
    'att',
    'är',
    'det',
    'som',
    'på',
    'jag',
    'inte',
    'med',
    'har',
    'för',
    'vi',
  ],
  vi: [
    'không',
    'và',
    'là',
    'của',
    'có',
    'một',
    'những',
    'được',
    'tôi',
    'này',
    'cho',
    'với',
  ],
};

const LETTER = /\p{L}/gu;
const LATIN = /[A-Za-zÀ-ɏḀ-ỿ]/g;

const countOf = (text: string, pattern: RegExp) =>
  text.match(pattern)?.length ?? 0;

function arabicScript(text: string): string {
  if (/[ٹڈڑںےۓ]/.test(text)) return 'ur';
  if (/[پچژگکی]/.test(text)) return 'fa';
  return 'ar';
}

function cyrillic(text: string): string {
  return /[іїєґІЇЄҐ]/.test(text) ? 'uk' : 'ru';
}

function latin(text: string): string | undefined {
  const words = text.toLowerCase().match(/\p{L}+/gu) ?? [];
  if (words.length < 3) return undefined;
  const scores = Object.entries(WORDS).map(([code, list]) => {
    const set = new Set(list);
    return { code, hits: words.filter((w) => set.has(w)).length };
  });
  scores.sort((a, b) => b.hits - a.hits);
  const [best, next] = scores;
  // a clear lead, on enough of the text
  if (!best || best.hits < Math.max(2, words.length * 0.05)) return undefined;
  if (next && best.hits < next.hits * 1.3) return undefined;
  return best.code;
}

export function guessLanguage(cues: Cue[]): string | undefined {
  const text = cues
    .map((cue) => cue.text)
    .join(' ')
    .replace(/<[^>]*>|\[[^\]]*\]|\([^)]*\)/g, ' ');
  const letters = countOf(text, LETTER);
  if (!letters) return undefined;
  let best: { code: string; count: number } | undefined;
  for (const [pattern, code] of SCRIPTS) {
    const count = countOf(text, pattern);
    if (count && (!best || count > best.count)) best = { code, count };
  }
  // a script beside Latin wins when it is a fair share: English words turn up in most subtitles
  if (best && best.count >= letters * 0.3) {
    // Japanese writes kanji beside kana
    if (best.code === 'zh' && countOf(text, /[぀-ヿ]/g) > 0) return 'ja';
    if (best.code === 'ar') return arabicScript(text);
    if (best.code === 'ru') return cyrillic(text);
    return best.code;
  }
  return countOf(text, LATIN) >= letters * 0.7 ? latin(text) : undefined;
}
