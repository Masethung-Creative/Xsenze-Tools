/**
 * The voice engines Audio Dub can use, and how Auto picks one per language.
 * Shared by the page (to show choices) and the voice worker (to run them).
 * Engines are tried in order: the first that speaks the language wins.
 */

export type EngineId = 'supertonic' | 'mms';
export type EngineChoice = 'auto' | EngineId;
export type VoiceGender = 'female' | 'male';

export interface EngineInfo {
  id: EngineId;
  name: string;
  /** For tight controls. */
  short: string;
  /** One line for the info note. */
  note: string;
  licence: string;
  licenceUrl: string;
  /** Rough one-time download, for the note. */
  sizeMb: number;
  /** Our language codes (as in lib/translate) this engine speaks. */
  languages: readonly string[];
  /** Genders it has voices for. */
  voices: readonly VoiceGender[];
  /** Whether the engine has its own speed control (pitch kept). */
  speedControl: boolean;
}

/** Supertonic 3: 31 languages, 5 female and 5 male voices. */
export const SUPERTONIC_LANGUAGES = [
  'en',
  'ko',
  'ja',
  'ar',
  'bg',
  'cs',
  'da',
  'de',
  'el',
  'es',
  'et',
  'fi',
  'fr',
  'hi',
  'hr',
  'hu',
  'id',
  'it',
  'lt',
  'lv',
  'nl',
  'pl',
  'pt',
  'ro',
  'ru',
  'sk',
  'sl',
  'sv',
  'tr',
  'uk',
  'vi',
] as const;

/** MMS voices already converted for the browser: our code to the model's ISO 639-3. */
export const MMS_MODELS: Record<string, string> = {
  en: 'eng',
  hi: 'hin',
  es: 'spa',
  fr: 'fra',
  de: 'deu',
  ar: 'ara',
  ru: 'rus',
  ko: 'kor',
  pt: 'por',
  vi: 'vie',
  ro: 'ron',
};

export const ENGINES: EngineInfo[] = [
  {
    id: 'supertonic',
    name: 'Supertonic 3',
    short: 'Supertonic',
    note: 'Natural voices in 31 languages, female or male.',
    licence: 'OpenRAIL-M',
    licenceUrl:
      'https://huggingface.co/supertone-oss-archive/supertonic-3/blob/main/LICENSE',
    sizeMb: 400,
    languages: SUPERTONIC_LANGUAGES,
    voices: ['female', 'male'],
    speedControl: true,
  },
  {
    id: 'mms',
    name: 'MMS',
    short: 'MMS',
    note: 'Meta’s massively multilingual voices: one voice per language.',
    licence: 'CC-BY-NC 4.0',
    licenceUrl: 'https://huggingface.co/facebook/mms-tts',
    sizeMb: 35,
    languages: Object.keys(MMS_MODELS),
    voices: ['female'],
    speedControl: false,
  },
];

export const engineInfo = (id: EngineId): EngineInfo =>
  ENGINES.find((e) => e.id === id)!;

/** Every language some engine can voice. */
export const DUB_LANGUAGES = new Set(ENGINES.flatMap((e) => e.languages));

/** The engine that voices `language`: the first in order, or the forced one if it can. */
export function pickEngine(
  language: string,
  choice: EngineChoice = 'auto',
): EngineId | null {
  if (choice !== 'auto')
    return engineInfo(choice).languages.includes(language) ? choice : null;
  return ENGINES.find((e) => e.languages.includes(language))?.id ?? null;
}

/** ISO 639-2/T codes for language-tagged audio tracks in MP4. */
const ISO3: Record<string, string> = {
  en: 'eng',
  ko: 'kor',
  ja: 'jpn',
  ar: 'ara',
  bg: 'bul',
  cs: 'ces',
  da: 'dan',
  de: 'deu',
  el: 'ell',
  es: 'spa',
  et: 'est',
  fi: 'fin',
  fr: 'fra',
  hi: 'hin',
  hr: 'hrv',
  hu: 'hun',
  id: 'ind',
  it: 'ita',
  lt: 'lit',
  lv: 'lav',
  nl: 'nld',
  pl: 'pol',
  pt: 'por',
  ro: 'ron',
  ru: 'rus',
  sk: 'slk',
  sl: 'slv',
  sv: 'swe',
  tr: 'tur',
  uk: 'ukr',
  vi: 'vie',
  ta: 'tam',
  te: 'tel',
  ml: 'mal',
  kn: 'kan',
  bn: 'ben',
  mr: 'mar',
  gu: 'guj',
  pa: 'pan',
  ur: 'urd',
  zh: 'zho',
  th: 'tha',
};

export const iso3 = (code: string) => ISO3[code] ?? 'und';
