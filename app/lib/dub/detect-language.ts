/**
 * Which language a transcript is in, on the device: the browser's own
 * Language Detector where there is one, otherwise the writing system and the
 * most common words. Returns one of our language codes, or '' when unsure.
 */

interface Detector {
  detect(
    text: string,
  ): Promise<{ detectedLanguage: string; confidence: number }[]>;
}

interface DetectorStatic {
  availability(): Promise<string>;
  create(): Promise<Detector>;
}

const SCRIPTS: [RegExp, string][] = [
  [/[஀-௿]/, 'ta'],
  [/[ఀ-౿]/, 'te'],
  [/[ഀ-ൿ]/, 'ml'],
  [/[ಀ-೿]/, 'kn'],
  [/[ঀ-৿]/, 'bn'],
  [/[઀-૿]/, 'gu'],
  [/[਀-੿]/, 'pa'],
  [/[ऀ-ॿ]/, 'hi'],
  [/[฀-๿]/, 'th'],
  [/[぀-ヿ]/, 'ja'],
  [/[가-힯]/, 'ko'],
  [/[一-鿿]/, 'zh'],
  [/[֐-׿]/, 'he'],
  [/[؀-ۿ]/, 'ar'],
  [/[Ͱ-Ͽ]/, 'el'],
];

/** A handful of very common words per Latin or Cyrillic language. */
const WORDS: Record<string, string[]> = {
  en: ['the', 'and', 'is', 'you', 'to', 'of', 'we', 'this', 'it', 'for'],
  es: ['el', 'la', 'de', 'que', 'y', 'en', 'los', 'es', 'por', 'una'],
  fr: ['le', 'la', 'les', 'et', 'est', 'de', 'des', 'une', 'vous', 'nous'],
  de: ['der', 'die', 'und', 'ist', 'das', 'nicht', 'ich', 'wir', 'ein', 'zu'],
  it: ['il', 'di', 'che', 'e', 'la', 'per', 'non', 'una', 'sono', 'gli'],
  pt: ['de', 'que', 'não', 'uma', 'os', 'para', 'com', 'você', 'é', 'do'],
  nl: ['de', 'het', 'een', 'en', 'is', 'van', 'niet', 'ik', 'wij', 'dat'],
  pl: ['nie', 'się', 'jest', 'to', 'że', 'na', 'w', 'i', 'jak', 'co'],
  tr: ['bir', 've', 'bu', 'için', 'ne', 'çok', 'da', 'de', 'ben', 'mi'],
  sv: ['och', 'det', 'är', 'att', 'en', 'jag', 'inte', 'som', 'på', 'vi'],
  id: [
    'yang',
    'dan',
    'ini',
    'itu',
    'tidak',
    'saya',
    'kita',
    'untuk',
    'ada',
    'dengan',
  ],
  vi: ['và', 'là', 'của', 'không', 'có', 'một', 'những', 'tôi', 'được', 'các'],
  ru: ['и', 'в', 'не', 'на', 'что', 'это', 'я', 'с', 'как', 'мы'],
  uk: ['і', 'в', 'не', 'на', 'що', 'це', 'я', 'з', 'як', 'ми'],
};

function guess(text: string): string {
  for (const [script, code] of SCRIPTS) if (script.test(text)) return code;
  const words = text.toLowerCase().match(/[\p{L}']+/gu) ?? [];
  if (!words.length) return '';
  let best = '';
  let bestScore = 0;
  for (const [code, list] of Object.entries(WORDS)) {
    const set = new Set(list);
    const score = words.filter((w) => set.has(w)).length / words.length;
    if (score > bestScore) {
      bestScore = score;
      best = code;
    }
  }
  return bestScore >= 0.04 ? best : '';
}

export async function detectLanguage(text: string): Promise<string> {
  const api = (globalThis as unknown as { LanguageDetector?: DetectorStatic })
    .LanguageDetector;
  if (api) {
    try {
      if ((await api.availability()) === 'available') {
        const detector = await api.create();
        const [top] = await detector.detect(text);
        if (top && top.confidence > 0.6) return top.detectedLanguage;
      }
    } catch {
      // fall back to the guess
    }
  }
  return guess(text);
}
