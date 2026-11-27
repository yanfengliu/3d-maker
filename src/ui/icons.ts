const paths = {
  studio: '<path d="m12 3 9 5v9l-9 5-9-5V8zM3 8l9 5 9-5M12 13v9"/>',
  library:
    '<rect x="3" y="3" width="7" height="7" rx="1.3"/><rect x="14" y="3" width="7" height="7" rx="1.3"/><rect x="3" y="14" width="7" height="7" rx="1.3"/><rect x="14" y="14" width="7" height="7" rx="1.3"/>',
  layers: '<path d="m3 8 9-5 9 5-9 5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
  back: '<path d="m14 6-6 6 6 6"/>',
  forward: '<path d="m10 6 6 6-6 6"/>',
  vehicle: '<path d="M3 16V9l2-4h13l3 6v5M3 12h18M7 16h10"/><circle cx="6" cy="17" r="2"/><circle cx="18" cy="17" r="2"/>',
  building: '<path d="M3 21h18M5 21V4h10v17m0-11h4v11M8 8h1m2 0h1m-4 3h1m2 0h1m-4 3h1m2 0h1"/>',
  animal: '<path d="M7 15c2-6 8-6 10 0 3 6-4 3-5 3s-8 3-5-3Z"/><ellipse cx="4.8" cy="11" rx="1.6" ry="2"/><ellipse cx="9" cy="6" rx="1.6" ry="2"/><ellipse cx="15" cy="6" rx="1.6" ry="2"/><ellipse cx="19.2" cy="11" rx="1.6" ry="2"/>',
  terrain: '<path d="m2 19 7-13 5 8 3-5 5 10zM6.5 10.5l2.5 2 2.2-2.2"/>',
  tool: '<path d="M14 5a5 5 0 0 0-6 6L3 16a2 2 0 0 0 4 4l6-6a5 5 0 0 0 6-6l-3 3-3-3z"/>',
  attachment:'<path d="m8 14 6-6a2 2 0 0 1 3 3l-7 7a4 4 0 0 1-6-6l8-8a5 5 0 0 1 7 7l-7 7"/>',
  hand:'<path d="M8 12V5a1.5 1.5 0 0 1 3 0v6-7a1.5 1.5 0 0 1 3 0v7-6a1.5 1.5 0 0 1 3 0v7-4a1.5 1.5 0 0 1 3 0v6c0 5-3 8-7 8h-1c-2 0-4-1-5-3l-4-6a1.5 1.5 0 0 1 2-2l3 3"/>',
  chevron: '<path d="m8 10 4 4 4-4"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  diagonal: '<path d="M6 18 18 6M7 6h11v11"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  sliders:
    '<path d="M4 6h6m4 0h6M4 12h10m4 0h2M4 18h2m4 0h10"/><circle cx="12" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/>',
  save: '<path d="M5 3h11l4 4v14H4V3zM8 3v6h8V3M8 21v-8h8v8"/>',
  reset: '<path d="M4 9a8 8 0 1 1 0 7M4 4v5h5"/>',
  folder: '<path d="M3 7V5h7l2 3h9v12H3z"/>',
  expand: '<path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5"/>',
  grid: '<path d="m2 14 9-10 11 6-10 11zM5.5 10l11 6m-7-10 11 6M6 17l10-11m-6 13 10-11"/>',
  orbit:
    '<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-35 12 12)"/><circle cx="12" cy="12" r="2.5"/>',
  focus: '<path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"/><circle cx="12" cy="12" r="3"/>',
  code: '<path d="m7 8-4 4 4 4m10-8 4 4-4 4M14 4l-4 16"/>',
  spark:
    '<path d="m10 3 2.3 6.7L19 12l-6.7 2.3L10 21l-2.3-6.7L1 12l6.7-2.3zM19 2l1 3 3 1-3 1-1 3-1-3-3-1 3-1z"/>',
  play: '<path d="m8 4 12 8-12 8z"/>',
  pause: '<path d="M8 4v16m8-16v16"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4m10 0h4M3 15h4m10 0h4"/>',
  person: '<circle cx="12" cy="7" r="3"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/>',
  pointer: '<path d="M5 3v17l5-5 4 7 3-2-4-7 7-1z"/>',
  mouse: '<rect x="5" y="2" width="14" height="20" rx="7"/><path d="M12 2v7"/>',
  palette: '<circle cx="12" cy="12" r="8"/><path d="M5 15 15 5"/>',
  bolt: '<path d="m14 2-9 12h6l-1 8 9-13h-6z"/>',
} as const;
export type Icon = keyof typeof paths;
export function icon(name: Icon, size = 18) {
  return `<svg class="icon" width="${String(size)}" height="${String(size)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}
