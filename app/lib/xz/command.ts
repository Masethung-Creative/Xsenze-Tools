/*
 * Ported from the delphicanon UI kit (0BSD, Copyright (C) 2025-2026 Ruby Morgan Voigt).
 * Permission to use, copy, modify, and/or distribute this software for any purpose
 * with or without fee is hereby granted.
 */
/** What the matcher reads of a command palette item. */
export interface CommandEntry {
  id: string;
  title: string;
  /** Items with the same group show under one heading; none shows no heading. */
  group?: string;
  /** Matched like the title, `keywordPenalty` lower. */
  keywords?: string[];
  /** Shown for every query, above everything the query matched. */
  answer?: boolean;
  disabled?: boolean;
}

export interface CommandGroup<T extends CommandEntry> {
  name: string | undefined;
  items: T[];
}

/** Score of an answer row: above any match. */
export const answerScore = 100;
/** A keyword match counts this much less than the same title match. */
export const keywordPenalty = 5;

/**
 * The Omnibox matcher (delphitools-mac Providers.swift `matchScore`): 90
 * when the text starts with the query, 80 when a word does, 60 when it
 * contains it, 40 when the query's characters appear in order, else
 * undefined. Case-insensitive.
 */
export function matchScore(query: string, text: string): number | undefined {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.startsWith(q)) return 90;
  if (t.split(' ').some((word) => word.startsWith(q))) return 80;
  if (t.includes(q)) return 60;
  let from = 0;
  for (const character of q) {
    const found = t.indexOf(character, from);
    if (found < 0) return undefined;
    from = found + character.length;
  }
  return 40;
}

/** The best of the title's score and each keyword's, less `keywordPenalty`. */
export function itemScore(
  query: string,
  item: CommandEntry,
): number | undefined {
  if (item.answer) return answerScore;
  const scores = [
    matchScore(query, item.title),
    ...(item.keywords ?? []).map((keyword) => {
      const score = matchScore(query, keyword);
      return score === undefined ? undefined : score - keywordPenalty;
    }),
  ].filter((score) => score !== undefined);
  return scores.length ? Math.max(...scores) : undefined;
}

/**
 * Items that do not match the query drop; an empty query matches all at 0.
 * Items sort by score, ties in the given order, and group under their first
 * item, so groups sort by their best score. Answers come first.
 */
export function rank<T extends CommandEntry>(
  items: readonly T[],
  query: string,
): CommandGroup<T>[] {
  const q = query.trim();
  const groups = new Map<string | undefined, T[]>();
  const scored = items
    .map((item, index) => ({
      item,
      index,
      score: q ? itemScore(q, item) : item.answer ? answerScore : 0,
    }))
    .filter((entry) => entry.score !== undefined) as {
    item: T;
    index: number;
    score: number;
  }[];
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  for (const { item } of scored) {
    const group = groups.get(item.group);
    if (group) group.push(item);
    else groups.set(item.group, [item]);
  }
  return [...groups].map(([name, items]) => ({ name, items }));
}

/**
 * The next index `delta` steps from `current` among `count` rows, wrapping
 * at both ends; -1 (nothing active) steps to the first or the last row.
 */
export function step(current: number, delta: number, count: number): number {
  if (count === 0) return -1;
  if (current < 0) return delta > 0 ? 0 : count - 1;
  return (((current + delta) % count) + count) % count;
}
