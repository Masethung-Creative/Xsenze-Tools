/** Row sizes that differ by at most one, larger rows first. */
export function balanced(count: number, perRow: number): number[] {
  if (count <= 0) return [];
  const width = Math.min(Math.max(1, perRow), count);
  const rows = Math.ceil(count / width);
  return Array.from(
    { length: rows },
    (_, row) => Math.floor(count / rows) + (row < count % rows ? 1 : 0),
  );
}

/**
 * Column span for each cell: the last cell of a row shorter than the widest
 * spans the rest of it.
 */
export function spans(count: number, perRow: number): number[] {
  const rows = balanced(count, perRow);
  const widest = rows[0] ?? 0;
  return rows.flatMap((size) =>
    Array.from({ length: size }, (_, i) =>
      i === size - 1 ? widest - size + 1 : 1,
    ),
  );
}
