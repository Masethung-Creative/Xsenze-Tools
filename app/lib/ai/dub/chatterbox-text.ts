/**
 * Text to token ids for Chatterbox Multilingual, matching its tokenizer.json
 * exactly: the general tokenizer gets its `[SPACE]` token and template wrong.
 * Also the per-language text preparation the model was trained with.
 */

interface AddedToken {
  id: number;
  content: string;
  normalized: boolean;
}

interface TokenizerJson {
  added_tokens: AddedToken[];
  model: { vocab: Record<string, number>; merges: string[] | string[][] };
  post_processor: {
    special_tokens: Record<string, { ids: number[] }>;
  };
}

export interface ChatterboxTokenizer {
  encode(text: string): number[];
}

/** Rust's `\w` (letters, marks, digits, connectors) and its complement, as the Whitespace pre-tokenizer splits. */
const WORDS = /[\p{L}\p{M}\p{Nd}\p{Pc}]+|[^\p{L}\p{M}\p{Nd}\p{Pc}\s]+/gu;

export function chatterboxTokenizer(json: TokenizerJson): ChatterboxTokenizer {
  const vocab = new Map(Object.entries(json.model.vocab));
  const unk = vocab.get('[UNK]') ?? 1;
  const ranks = new Map<string, number>();
  json.model.merges.forEach((m, i) =>
    ranks.set(Array.isArray(m) ? m.join(' ') : m, i),
  );
  const added = [...json.added_tokens].sort(
    (a, b) => b.content.length - a.content.length,
  );
  const special = (name: string) =>
    json.post_processor.special_tokens[name]?.ids ?? [];
  const head = [...special('EXAGGERATION'), ...special('BOS')];
  const tail = [
    ...special('EOS'),
    ...special('START_SPEECH'),
    ...special('START_SPEECH'),
  ];
  const cache = new Map<string, number[]>();

  const bpe = (word: string): number[] => {
    const hit = cache.get(word);
    if (hit) return hit;
    let parts = [...word];
    for (;;) {
      let best = -1;
      let rank = Infinity;
      for (let i = 0; i < parts.length - 1; i++) {
        const r = ranks.get(`${parts[i]} ${parts[i + 1]}`);
        if (r !== undefined && r < rank) {
          rank = r;
          best = i;
        }
      }
      if (best < 0) break;
      parts = [
        ...parts.slice(0, best),
        parts[best]! + parts[best + 1]!,
        ...parts.slice(best + 2),
      ];
    }
    const ids: number[] = [];
    for (const p of parts) ids.push(vocab.get(p) ?? unk);
    cache.set(word, ids);
    return ids;
  };

  /** Split on added tokens (longest first), giving ids for them and running `rest` on the text between. */
  const split = (
    text: string,
    tokens: AddedToken[],
    rest: (piece: string) => number[],
  ): number[] => {
    const out: number[] = [];
    let from = 0;
    let i = 0;
    while (i < text.length) {
      const token = tokens.find((t) => text.startsWith(t.content, i));
      if (token) {
        if (i > from) out.push(...rest(text.slice(from, i)));
        out.push(token.id);
        i += token.content.length;
        from = i;
      } else i++;
    }
    if (from < text.length) out.push(...rest(text.slice(from)));
    return out;
  };

  const raw = added.filter((t) => !t.normalized);
  const normal = added.filter((t) => t.normalized);
  const words = (piece: string) =>
    (piece.match(WORDS) ?? []).flatMap((w) => bpe(w));

  return {
    encode(text) {
      const body = split(text, raw, (piece) =>
        // the normaliser turns spaces into [SPACE], matched after normalising
        split(piece.replaceAll(' ', '[SPACE]'), normal, words),
      );
      return [...head, ...body, ...tail];
    },
  };
}

/* --- per-language preparation --- */

/** Hangul syllables to their jamo, the form the model reads Korean in. */
function koreanJamo(text: string): string {
  let out = '';
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7af) {
      out += ch;
      continue;
    }
    const base = code - 0xac00;
    out += String.fromCharCode(0x1100 + Math.floor(base / (21 * 28)));
    out += String.fromCharCode(0x1161 + Math.floor((base % (21 * 28)) / 28));
    if (base % 28) out += String.fromCharCode(0x11a7 + (base % 28));
  }
  return out.trim();
}

export interface Cangjie {
  /** Glyph to its code, with the index suffix for shared codes. */
  codes: Map<string, string>;
}

/** Parse Cangjie5_TC.json ("glyph\tcode" lines) into glyph → code + index. */
export function cangjieFrom(entries: string[]): Cangjie {
  const byCode = new Map<string, string[]>();
  const first = new Map<string, string>();
  for (const entry of entries) {
    const [word, code] = entry.split('\t');
    if (!word || !code) continue;
    if (!first.has(word)) first.set(word, code);
    const list = byCode.get(code) ?? [];
    list.push(word);
    byCode.set(code, list);
  }
  const codes = new Map<string, string>();
  for (const [word, code] of first) {
    const index = byCode.get(code)!.indexOf(word);
    codes.set(word, index > 0 ? `${code}${index}` : code);
  }
  return { codes };
}

const OTHER_LETTER = /\p{Lo}/u;

/** Chinese characters to Cangjie code tokens: 你 → [cj_o][cj_n][cj_f][cj_.] */
function chineseCangjie(text: string, cj: Cangjie): string {
  let out = '';
  for (const ch of text) {
    const code = OTHER_LETTER.test(ch) ? cj.codes.get(ch) : undefined;
    if (!code) {
      out += ch;
      continue;
    }
    for (const c of code) out += `[cj_${c}]`;
    out += '[cj_.]';
  }
  return out;
}

/** The text as the model expects it, led by its language tag. */
export function prepareChatterbox(
  text: string,
  lang: string,
  cangjie?: Cangjie,
): string {
  let t = text.replace(/\s+/g, ' ').trim();
  if (lang === 'ko') t = koreanJamo(t);
  else if (lang === 'zh' && cangjie) t = chineseCangjie(t, cangjie);
  // a closing stop keeps the model from trailing off
  if (t && !/[.!?。！？…]$/.test(t)) t += lang === 'zh' ? '。' : '.';
  return `[${lang}]${t}`;
}
