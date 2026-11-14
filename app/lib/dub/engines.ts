/**
 * The voice engines Audio Dub can use, and how Auto picks one per language.
 * Shared by the page (to show choices) and the voice worker (to run them).
 * Engines are tried in order: the first that speaks the language wins.
 * Indic Parler comes after Supertonic, so Auto gives it the Indian languages
 * Supertonic lacks. Chatterbox comes last, so Auto uses it only where no
 * preset engine speaks; picked on its own it clones every speaker's voice.
 */

export type EngineId = 'supertonic' | 'parler' | 'mms' | 'chatterbox';
export type EngineChoice = 'auto' | EngineId;
export type VoiceGender = 'female' | 'male';

/** Supertonic's preset voices: five female, five male. */
export const FEMALE_PRESETS = ['F1', 'F2', 'F3', 'F4', 'F5'] as const;
export const MALE_PRESETS = ['M1', 'M2', 'M3', 'M4', 'M5'] as const;
export const PRESETS = [...FEMALE_PRESETS, ...MALE_PRESETS];
export type Preset =
  (typeof FEMALE_PRESETS)[number] | (typeof MALE_PRESETS)[number];

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
  /** Speaks in each speaker's own voice from a clip of the original. */
  clones?: boolean;
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

/** Chatterbox Multilingual's languages we can translate to (Japanese needs a kana reader it lacks here). */
export const CHATTERBOX_LANGUAGES = [
  'ar',
  'da',
  'de',
  'el',
  'en',
  'es',
  'fi',
  'fr',
  'he',
  'hi',
  'it',
  'ko',
  'ms',
  'nl',
  'no',
  'pl',
  'pt',
  'ru',
  'sv',
  'sw',
  'tr',
  'zh',
] as const;

/** Cloning engines hear the reference clip at this rate, trimmed to this length. */
export const CLONE_RATE = 24000;
export const CLONE_SECONDS = 10;

/**
 * Indic Parler-TTS's named voices for each language we translate to, sorted
 * by their measured pitch into female and male (best first), each checked by
 * transcribing it back. Tamil has no male voice of its own: Malayalam's
 * Harish and Kannada's Suresh read it clearly; nor has Nepali, which Hindi's
 * Rohit and Aman read clearly (and Divya, beside its own Amrita). Bengali's
 * Arjun measured 203 Hz, too high to be sure of, so he is left out.
 */
export const PARLER_VOICES: Record<
  string,
  { female: readonly string[]; male: readonly string[] }
> = {
  ta: { female: ['Jaya', 'Kavitha'], male: ['Harish', 'Suresh'] },
  hi: { female: ['Divya', 'Rani'], male: ['Rohit', 'Aman'] },
  bn: { female: ['Aditi', 'Rashmi', 'Riya'], male: ['Tapan', 'Arnav'] },
  mr: {
    female: ['Sunita', 'Isha', 'Radha'],
    male: ['Sanjay', 'Nikhil', 'Varun'],
  },
  pa: { female: ['Divjot'], male: ['Gurpreet'] },
  gu: { female: ['Neha'], male: ['Yash'] },
  kn: { female: ['Anu', 'Vidya'], male: ['Chetan', 'Suresh'] },
  ml: { female: ['Anjali', 'Anju'], male: ['Harish'] },
  te: { female: ['Lalitha'], male: ['Kiran', 'Prakash'] },
  ne: { female: ['Amrita', 'Divya'], male: ['Rohit', 'Aman'] },
};

export const PARLER_LANGUAGES = Object.keys(PARLER_VOICES);

/** The named Parler voice `preset` stands for in `lang`: its gender, then its number. */
export function parlerVoice(lang: string, preset: Preset): string {
  const voices = PARLER_VOICES[lang] ?? { female: ['Jaya'], male: [] };
  const male = preset.startsWith('M');
  const list = male && voices.male.length ? voices.male : voices.female;
  return list[(Number(preset.slice(1)) - 1) % list.length]!;
}

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
    id: 'parler',
    name: 'Indic Parler-TTS',
    short: 'Indic',
    note: 'AI4Bharat’s voices for Indian languages, female or male.',
    licence: 'Apache 2.0',
    licenceUrl: 'https://huggingface.co/ai4bharat/indic-parler-tts',
    // all of its files (see lib/dub/parler.ts), which its download bar counts on
    sizeMb: 2144,
    languages: PARLER_LANGUAGES,
    voices: ['female', 'male'],
    speedControl: false,
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
  {
    id: 'chatterbox',
    name: 'Chatterbox',
    short: 'Clone',
    note: 'Each speaker keeps their own voice, cloned from their lines in the original.',
    licence: 'MIT',
    licenceUrl:
      'https://huggingface.co/onnx-community/chatterbox-multilingual-ONNX',
    sizeMb: 1550,
    languages: CHATTERBOX_LANGUAGES,
    voices: ['female', 'male'],
    speedControl: false,
    clones: true,
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
  he: 'heb',
  ms: 'msa',
  no: 'nor',
  sw: 'swa',
  ta: 'tam',
  te: 'tel',
  ml: 'mal',
  kn: 'kan',
  bn: 'ben',
  mr: 'mar',
  gu: 'guj',
  pa: 'pan',
  ur: 'urd',
  ne: 'nep',
  zh: 'zho',
  th: 'tha',
};

export const iso3 = (code: string) => ISO3[code] ?? 'und';
