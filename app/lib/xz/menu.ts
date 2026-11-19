/*
 * Ported from the delphicanon UI kit (0BSD, Copyright (C) 2025-2026 Ruby Morgan Voigt).
 * Permission to use, copy, modify, and/or distribute this software for any purpose
 * with or without fee is hereby granted.
 */
/** A menu entry: an item, or a rule between groups. */
export type XzMenuEntry<Icon = unknown> = XzMenuItem<Icon> | XzMenuSeparator;

export interface XzMenuSeparator {
  kind: 'separator';
}

export interface XzMenuItem<Icon = unknown> {
  title: string;
  /** checkbox and radio items show `checked`; the consumer flips it on select. Radios group between separators. */
  kind?: 'item' | 'checkbox' | 'radio';
  checked?: boolean;
  icon?: Icon;
  /** Hint at the trailing edge, such as ⌘D; the app binds the key itself. */
  shortcut?: string;
  /** Focusable, not selectable. */
  disabled?: boolean;
  destructive?: boolean;
  /** A submenu, one level deep: the items of a submenu cannot open another. */
  items?: XzMenuEntry<Icon>[];
}

export type XzMenuRole = 'menuitem' | 'menuitemcheckbox' | 'menuitemradio';

export function isSeparator<Icon>(
  entry: XzMenuEntry<Icon>,
): entry is XzMenuSeparator {
  return entry.kind === 'separator';
}

export function menuRole(item: XzMenuItem<unknown>): XzMenuRole {
  if (item.kind === 'checkbox') return 'menuitemcheckbox';
  if (item.kind === 'radio') return 'menuitemradio';
  return 'menuitem';
}

/** `index` moved by `step` in a ring of `count`; -1 steps into the ring from outside. */
export function wrap(index: number, step: number, count: number): number {
  if (count <= 0) return -1;
  if (index < 0) return step >= 0 ? 0 : count - 1;
  return (((index + step) % count) + count) % count;
}

/** Keys typed within this many ms of each other search as one string. */
export const typeAheadMs = 500;

/**
 * The next title after `from` that starts with `typed`, ignoring case, or
 * -1. A longer string may match the item at `from` itself; one letter
 * typed again and again steps through the items it starts.
 */
export function typeAhead(
  titles: string[],
  typed: string,
  from: number,
): number {
  const text = typed.toLowerCase();
  if (!text) return -1;
  const repeated = [...text].every((letter) => letter === text[0]);
  const needle = repeated ? text[0]! : text;
  const start = repeated ? from + 1 : Math.max(from, 0);
  const count = titles.length;
  for (let i = 0; i < count; i++) {
    const at = (start + i) % count;
    if (titles[at]!.toLowerCase().startsWith(needle)) return at;
  }
  return -1;
}
