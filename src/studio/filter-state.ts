import type { BrowseQuery } from '../data/browse';

export interface ActiveFilterChip {
  kind: 'source' | 'category' | 'query';
  label: string;
}

/** Format a sidebar source count, showing `matching / total` whenever another filter narrows it. */
export function formatSourceBadge(matching: number, total: number, narrowed: boolean): string {
  if (narrowed && total > 0) return `${String(matching)}/${String(total)}`;
  return String(total);
}

/** Combine active source and category filter labels into the grid heading. */
export function formatListingTitle(
  filters: Pick<BrowseQuery, 'source' | 'category'>,
  sourceLabel: string,
  categoryLabel: string,
): string {
  if (filters.source === 'all' && filters.category === 'all') return 'All assets';
  if (filters.category === 'all') return sourceLabel;
  if (filters.source === 'all') return categoryLabel;
  return `${sourceLabel} · ${categoryLabel}`;
}

/** Return removable filter chips for every non-default active inventory filter. */
export function buildActiveFilterChips(
  filters: Pick<BrowseQuery, 'source' | 'category' | 'query'>,
  sourceLabel: string,
  categoryLabel: string,
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];
  if (filters.source !== 'all') chips.push({ kind: 'source', label: `Source: ${sourceLabel}` });
  if (filters.category !== 'all') chips.push({ kind: 'category', label: `Category: ${categoryLabel}` });
  const trimmed = filters.query.trim();
  if (trimmed) chips.push({ kind: 'query', label: `Search: “${trimmed}”` });
  return chips;
}
