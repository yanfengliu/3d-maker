import { describe, expect, it } from 'vitest';
import { buildActiveFilterChips, formatListingTitle, formatSourceBadge } from './filter-state';

describe('inventory filter toggle state formatting', () => {
  it('shows matching/total on source badges when narrowed by category or search', () => {
    expect(formatSourceBadge(106, 106, false)).toBe('106');
    expect(formatSourceBadge(18, 106, true)).toBe('18/106');
    expect(formatSourceBadge(0, 106, true)).toBe('0/106');
    expect(formatSourceBadge(0, 0, true)).toBe('0');
  });

  it('combines active source and category in the listing title', () => {
    expect(formatListingTitle({ source: 'all', category: 'all' }, 'All assets', 'All categories')).toBe('All assets');
    expect(formatListingTitle({ source: 'original', category: 'all' }, 'Originals', 'All categories')).toBe('Originals');
    expect(formatListingTitle({ source: 'all', category: 'character' }, 'All assets', 'Characters')).toBe('Characters');
    expect(formatListingTitle({ source: 'original', category: 'character' }, 'Originals', 'Characters')).toBe('Originals · Characters');
  });

  it('builds removable filter chips for every active filter', () => {
    expect(buildActiveFilterChips({ source: 'all', category: 'all', query: '   ' }, 'All assets', 'All categories')).toEqual([]);
    expect(buildActiveFilterChips({ source: 'original', category: 'character', query: ' knight ' }, 'Originals', 'Characters')).toEqual([
      { kind: 'source', label: 'Source: Originals' },
      { kind: 'category', label: 'Category: Characters' },
      { kind: 'query', label: 'Search: “knight”' },
    ]);
  });
});
