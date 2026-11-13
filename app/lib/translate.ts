/**
 * On-device text translation for subtitles. Two engines, both local:
 *  - the browser's built-in Translator API (desktop Chrome / Edge 138+), small
 *    language packs managed by the browser;
 *  - NLLB-200 (distilled 600M) through Transformers.js, about 600 MB once,
 *    then cached; 200 languages in any modern browser.
 * The subtitle text never leaves the device; only model files are downloaded.
 */

export type Engine = 'browser' | 'nllb';
export type EngineChoice = 'auto' | 'nllb';

export interface Language {
  /** BCP 47, used by the browser engine */
  code: string;
  name: string;
  /** FLORES-200 code, used by NLLB */
  flores: string;
  rtl?: boolean;
  /** Flag file in public/flags when it differs from code. */
  flag?: string;
}

export const TRANSLATE_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flores: 'eng_Latn' },
  { code: 'ta', name: 'Tamil', flores: 'tam_Taml' },
  { code: 'hi', name: 'Hindi', flores: 'hin_Deva' },
  { code: 'te', name: 'Telugu', flores: 'tel_Telu' },
  { code: 'ml', name: 'Malayalam', flores: 'mal_Mlym' },
  { code: 'kn', name: 'Kannada', flores: 'kan_Knda' },
  { code: 'bn', name: 'Bengali', flores: 'ben_Beng' },
  { code: 'mr', name: 'Marathi', flores: 'mar_Deva' },
  { code: 'gu', name: 'Gujarati', flores: 'guj_Gujr' },
  { code: 'pa', name: 'Punjabi', flores: 'pan_Guru' },
  { code: 'ur', name: 'Urdu', flores: 'urd_Arab', rtl: true },
  { code: 'si', name: 'Sinhala', flores: 'sin_Sinh' },
  { code: 'ne', name: 'Nepali', flores: 'npi_Deva' },
  { code: 'es', name: 'Spanish', flores: 'spa_Latn' },
  { code: 'fr', name: 'French', flores: 'fra_Latn' },
  { code: 'de', name: 'German', flores: 'deu_Latn' },
  { code: 'it', name: 'Italian', flores: 'ita_Latn' },
  { code: 'pt', name: 'Portuguese', flores: 'por_Latn' },
  { code: 'nl', name: 'Dutch', flores: 'nld_Latn' },
  { code: 'pl', name: 'Polish', flores: 'pol_Latn' },
  { code: 'ru', name: 'Russian', flores: 'rus_Cyrl' },
  { code: 'uk', name: 'Ukrainian', flores: 'ukr_Cyrl' },
  { code: 'tr', name: 'Turkish', flores: 'tur_Latn' },
  { code: 'el', name: 'Greek', flores: 'ell_Grek' },
  { code: 'sv', name: 'Swedish', flores: 'swe_Latn' },
  { code: 'da', name: 'Danish', flores: 'dan_Latn' },
  { code: 'fi', name: 'Finnish', flores: 'fin_Latn' },
  { code: 'no', name: 'Norwegian', flores: 'nob_Latn' },
  { code: 'cs', name: 'Czech', flores: 'ces_Latn' },
  { code: 'ro', name: 'Romanian', flores: 'ron_Latn' },
  { code: 'hu', name: 'Hungarian', flores: 'hun_Latn' },
  { code: 'ar', name: 'Arabic', flores: 'arb_Arab', rtl: true },
  { code: 'he', name: 'Hebrew', flores: 'heb_Hebr', rtl: true },
  { code: 'fa', name: 'Persian', flores: 'pes_Arab', rtl: true },
  { code: 'zh', name: 'Chinese (Simplified)', flores: 'zho_Hans' },
  {
    code: 'zh-Hant',
    name: 'Chinese (Traditional)',
    flores: 'zho_Hant',
    flag: 'zh',
  },
  { code: 'ja', name: 'Japanese', flores: 'jpn_Jpan' },
  { code: 'ko', name: 'Korean', flores: 'kor_Hang' },
  { code: 'th', name: 'Thai', flores: 'tha_Thai' },
  { code: 'vi', name: 'Vietnamese', flores: 'vie_Latn' },
  { code: 'id', name: 'Indonesian', flores: 'ind_Latn' },
  { code: 'ms', name: 'Malay', flores: 'zsm_Latn' },
  { code: 'tl', name: 'Filipino', flores: 'tgl_Latn' },
  { code: 'sw', name: 'Swahili', flores: 'swh_Latn' },
];

export const NLLB_MODEL = 'Xenova/nllb-200-distilled-600M';
export const NLLB_SIZE_MB = 600;

export interface Progress {
  phase: 'download' | 'translate';
  /** 0..1 */
  ratio: number;
}

export interface TranslateOptions {
  from: Language;
  to: Language;
  engine: EngineChoice;
  onProgress?: (progress: Progress) => void;
  /** Each line as it finishes, by index. */
  onLine?: (index: number, text: string) => void;
  signal?: AbortSignal;
}

interface BrowserTranslator {
  translate(text: string): Promise<string>;
  destroy?(): void;
}

interface TranslatorStatic {
  availability(pair: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<string>;
  create(options: {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (m: EventTarget) => void;
    signal?: AbortSignal;
  }): Promise<BrowserTranslator>;
}

const browserApi = (): TranslatorStatic | undefined =>
  (globalThis as unknown as { Translator?: TranslatorStatic }).Translator;

/** Can the browser's built-in translator do this pair? */
export async function browserCanTranslate(
  from: Language,
  to: Language,
): Promise<boolean> {
  const api = browserApi();
  if (!api) return false;
  try {
    const status = await api.availability({
      sourceLanguage: from.code,
      targetLanguage: to.code,
    });
    return status !== 'unavailable';
  } catch {
    return false;
  }
}

/** How long the browser translator may sit without download progress. */
const STALL_MS = 20_000;

const aborted = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
};

async function viaBrowser(
  texts: string[],
  options: TranslateOptions,
): Promise<string[]> {
  const api = browserApi()!;
  // a language pack that never starts (or stalls) must not hang the tool:
  // give up after STALL_MS without progress and let NLLB take over
  const stop = new AbortController();
  let timer = 0;
  const arm = () => {
    clearTimeout(timer);
    timer = window.setTimeout(() => stop.abort(), STALL_MS);
  };
  arm();
  const stalled = new Promise<never>((_, reject) =>
    stop.signal.addEventListener('abort', () =>
      reject(new Error('browser-translator-stalled')),
    ),
  );
  let translator: BrowserTranslator;
  try {
    translator = await Promise.race([
      api.create({
        sourceLanguage: options.from.code,
        targetLanguage: options.to.code,
        signal: stop.signal,
        monitor: (m) =>
          m.addEventListener('downloadprogress', (event) => {
            arm();
            options.onProgress?.({
              phase: 'download',
              ratio: (event as ProgressEvent).loaded,
            });
          }),
      }),
      stalled,
    ]);
  } finally {
    clearTimeout(timer);
  }
  try {
    const out: string[] = [];
    for (const [i, text] of texts.entries()) {
      aborted(options.signal);
      const line = text ? await translator.translate(text) : '';
      out.push(line);
      options.onLine?.(i, line);
      options.onProgress?.({
        phase: 'translate',
        ratio: (i + 1) / texts.length,
      });
    }
    return out;
  } finally {
    translator.destroy?.();
  }
}

type NllbPipe = (
  text: string[],
  options: { src_lang: string; tgt_lang: string },
) => Promise<{ translation_text: string }[]>;

type WorkerReply =
  | { type: 'progress'; ratio: number }
  | { type: 'ready' }
  | { type: 'result'; id: number; texts: string[] }
  | { type: 'error'; id?: number; message: string };

/** One worker for the page's lifetime; the model loads into it once. */
let worker: Worker | null = null;
let ready: Promise<void> | null = null;
let nextId = 0;
const pending = new Map<
  number,
  { resolve: (texts: string[]) => void; reject: (error: Error) => void }
>();
let onDownload: ((p: Progress) => void) | undefined;

function nllbWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./nllb.worker.ts', import.meta.url), {
    type: 'module',
  });
  worker.addEventListener('message', (event: MessageEvent<WorkerReply>) => {
    const reply = event.data;
    if (reply.type === 'progress')
      onDownload?.({ phase: 'download', ratio: reply.ratio });
    else if (reply.type === 'result') {
      pending.get(reply.id)?.resolve(reply.texts);
      pending.delete(reply.id);
    } else if (reply.type === 'error' && reply.id !== undefined) {
      pending.get(reply.id)?.reject(new Error(reply.message));
      pending.delete(reply.id);
    }
  });
  return worker;
}

function loadNllb(onProgress?: (p: Progress) => void): Promise<NllbPipe> {
  onDownload = onProgress;
  const w = nllbWorker();
  ready ??= new Promise<void>((resolve, reject) => {
    const listen = (event: MessageEvent<WorkerReply>) => {
      const reply = event.data;
      if (reply.type === 'ready') resolve();
      else if (reply.type === 'error' && reply.id === undefined)
        reject(new Error(reply.message));
      else return;
      w.removeEventListener('message', listen);
    };
    w.addEventListener('message', listen);
    w.postMessage({ type: 'load', model: NLLB_MODEL });
  });
  ready.catch(() => (ready = null));
  return ready.then(
    () =>
      (texts, { src_lang, tgt_lang }) =>
        new Promise<string[]>((resolve, reject) => {
          const id = nextId++;
          pending.set(id, { resolve, reject });
          w.postMessage({
            type: 'translate',
            id,
            texts,
            src: src_lang,
            tgt: tgt_lang,
          });
        }).then((out) => out.map((translation_text) => ({ translation_text }))),
  );
}

async function viaNllb(
  texts: string[],
  options: TranslateOptions,
): Promise<string[]> {
  const pipe = await loadNllb(options.onProgress);
  const out: string[] = [];
  const BATCH = 1;
  for (let i = 0; i < texts.length; i += BATCH) {
    aborted(options.signal);
    const batch = texts.slice(i, i + BATCH);
    const todo = batch.filter(Boolean);
    const result = todo.length
      ? await pipe(todo, {
          src_lang: options.from.flores,
          tgt_lang: options.to.flores,
        })
      : [];
    let k = 0;
    for (const text of batch) {
      const line = text ? (result[k++]?.translation_text ?? '') : '';
      out.push(line);
      options.onLine?.(out.length - 1, line);
    }
    options.onProgress?.({
      phase: 'translate',
      ratio: Math.min(1, (i + BATCH) / texts.length),
    });
  }
  return out;
}

/** Translate a list of texts, keeping order and empties. Returns the engine used. */
export async function translateTexts(
  texts: string[],
  options: TranslateOptions,
): Promise<{ texts: string[]; engine: Engine }> {
  if (options.from.code === options.to.code)
    return { texts: [...texts], engine: 'browser' };
  if (
    options.engine === 'auto' &&
    (await browserCanTranslate(options.from, options.to))
  ) {
    try {
      return { texts: await viaBrowser(texts, options), engine: 'browser' };
    } catch (error) {
      if (options.signal?.aborted) throw error;
      // fall through to NLLB
    }
  }
  return { texts: await viaNllb(texts, options), engine: 'nllb' };
}

/* --- subtitle text handling --- */

const TAG = /<[^>]+>|\{\\[^}]*\}/g;

/** Flatten a cue for translation: tags out, lines joined. */
export function prepareCue(text: string): {
  plain: string;
  italic: boolean;
  lines: number;
} {
  const trimmed = text.trim();
  const italic = /^<i>[\s\S]*<\/i>$/i.test(trimmed);
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim()).length;
  const plain = trimmed
    .replace(TAG, '')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return { plain, italic, lines };
}

/** Put a translated line back in shape: two lines if the source had two, italics kept. */
export function restoreCue(
  translated: string,
  shape: { italic: boolean; lines: number },
): string {
  let text = translated.trim();
  if (shape.lines >= 2 && text.length > 20) {
    const mid = Math.floor(text.length / 2);
    const before = text.lastIndexOf(' ', mid);
    const after = text.indexOf(' ', mid);
    const cut =
      before < 0
        ? after
        : after < 0
          ? before
          : mid - before <= after - mid
            ? before
            : after;
    if (cut > 0) text = `${text.slice(0, cut)}\n${text.slice(cut + 1)}`;
  }
  return shape.italic ? `<i>${text}</i>` : text;
}
