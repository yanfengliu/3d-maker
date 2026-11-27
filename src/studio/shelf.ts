import {
  browseAssets, categories, categoryLabel, localBrowseItems,
  type BrowseCategory, type BrowseItem, type BrowseLocals, type BrowseQuery, type BrowseSource,
} from '../data/browse';
import { clearPolyforkBackoff, expirePolyforkCooldown } from '../data/polyfork';
import { catalog } from '../data/recipe';
import { readInventory, removeAsset } from '../data/inventory';
import { listImports, deleteImport } from '../imports';
import { el, escapeHtml, report, notify } from '../ui/dom';
import { icon, type Icon } from '../ui/icons';
import { buildActiveFilterChips, formatListingTitle, formatSourceBadge } from './filter-state';
import { thumbnail } from './thumbnails';

const sources: { id: BrowseSource; label: string; icon: Icon }[] = [
  { id: 'all', label: 'All assets', icon: 'library' },
  { id: 'original', label: 'Originals', icon: 'studio' },
  { id: 'polyfork', label: 'PolyFork', icon: 'globe' },
  { id: 'saved', label: 'Saved', icon: 'folder' },
];
const categoryIcons: Record<BrowseCategory, Icon> = {
  prop: 'studio', character: 'person', vehicle: 'vehicle', building: 'building', animal: 'animal',
  terrain: 'terrain', ultra: 'tool', attachment: 'attachment', hand: 'hand', import: 'upload',
};
const sourceLabels = { original: 'Original', saved: 'Saved', polyfork: 'PolyFork' };
const perPage = 12;
interface Actions {
  open: (entry: BrowseItem, signal: AbortSignal) => Promise<void>;
  deleted: (id: string) => void;
  activeKey: () => string | null;
}
export function setupShelf(actions: Actions) {
  const grid = el('assetGrid');
  const query = el<HTMLInputElement>('inventorySearch');
  const pageInput = el<HTMLInputElement>('inventoryPageNumber');
  const prev = el<HTMLButtonElement>('inventoryPrev'), next = el<HTMLButtonElement>('inventoryNext');
  const filters: BrowseQuery = { source: 'all', category: 'all', query: '', page: 1 };
  let locals: BrowseLocals = { recipes: [], imports: [] };
  let load: AbortController | undefined, opening: AbortController | undefined;
  let timer = 0, retryTimer = 0, localsRevision = 0, pages = 1, pendingKey = '';
  let retryPage: number | undefined;
  let visible = new Map<string, BrowseItem>();
  const previews = new Map<string, {revision:string; image:string}>();

  function markSelection() {
    for (const card of grid.querySelectorAll<HTMLButtonElement>('.inv-card')) {
      card.setAttribute('aria-pressed', String(card.dataset.key === actions.activeKey()));
      card.setAttribute('aria-busy', String(card.dataset.key === pendingKey));
    }
  }
  function card(item: BrowseItem, index: number) {
    let image = item.thumbnailUrl;
    if (item.source === 'saved' && 'recipe' in item.entry) {
      const cached = previews.get(item.key);
      if (cached?.revision === item.entry.updatedAt) image = cached.image;
      else {
        image = thumbnail(item.entry.recipe);
        previews.set(item.key, {revision:item.entry.updatedAt,image});
      }
    }
    const title = escapeHtml(item.title);
    const key = escapeHtml(item.key);
    const swatch = item.source === 'original' ? item.recipe.template : item.category;
    const imgAttr = index < 6 ? 'loading="eager" fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
    const visual = `<div class="inv-picture" data-kind="${swatch}">
      <span class="no-picture">${icon(categoryIcons[item.category],36)}</span>
      ${image ? `<img src="${escapeHtml(image)}" alt="" ${imgAttr}/>` : ''}
      <span class="selection-tick">${icon('check',11)}</span></div>`;
    const remove = item.source === 'saved' ? `<button type="button" class="deleteasset square" data-delete="${key}" aria-label="Delete ${title}" title="Delete saved asset">${icon('trash',14)}</button>` : '';
    return `<article class="inv-tile"><button class="inv-card" type="button" data-key="${key}" data-source="${item.source}" aria-label="Open ${title}">
      ${visual}<span class="inv-caption"><strong>${title}</strong><small>${sourceLabels[item.source]} <span>·</span> ${categoryLabel(item.category)}</small></span></button>${remove}</article>`;
  }
  function results(items: BrowseItem[], emptyText: string) {
    const focusedKey = document.activeElement instanceof HTMLElement ? document.activeElement.closest<HTMLButtonElement>('.inv-card')?.dataset.key : undefined;
    visible = new Map(items.map(item => [item.key, item]));
    grid.innerHTML = items.length ? items.map((item, i) => card(item, i)).join('') : `<p class="no-results">${emptyText}</p>`;
    for (const img of grid.querySelectorAll('img')) {
      img.onerror = () => { img.hidden = true; };
    }
    markSelection();
    if (focusedKey) {
      const same = Array.from(grid.querySelectorAll<HTMLButtonElement>('.inv-card')).find(b=>b.dataset.key===focusedKey);
      same?.focus({preventScroll:true});
    }
  }
  function showImportCategory() {
    const button = el('inventoryCategories').querySelector<HTMLButtonElement>('[data-category="import"]');
    if (!button) return;
    const matches = locals.imports.length > 0 && localBrowseItems({...filters, source:'saved', category:'import', query:''}, locals).length > 0;
    button.hidden = filters.category !== 'import' && !((filters.source === 'all' || filters.source === 'saved') && matches);
  }
  function updateSourceCounts() {
    const narrowed = filters.category !== 'all' || filters.query.trim() !== '';
    const originalTotal = catalog.length;
    const originalMatch = narrowed ? localBrowseItems({ ...filters, source: 'original', page: 1 }, locals).length : originalTotal;
    const savedTotal = locals.recipes.length + locals.imports.length;
    const savedMatch = narrowed ? localBrowseItems({ ...filters, source: 'saved', page: 1 }, locals).length : savedTotal;
    const origEl = el('inventorySources').querySelector('button[data-source-filter="original"] small');
    if (origEl) origEl.textContent = formatSourceBadge(originalMatch, originalTotal, narrowed);
    const savedEl = el('inventorySources').querySelector('button[data-source-filter="saved"] small');
    if (savedEl) savedEl.textContent = formatSourceBadge(savedMatch, savedTotal, narrowed);
  }
  function renderActiveFilters() {
    const container = el('activeFilters');
    const sourceLabel = sources.find(source => source.id === filters.source)?.label ?? 'All assets';
    const catLabel = filters.category === 'all' ? 'All categories' : categoryLabel(filters.category);
    const chips = buildActiveFilterChips(filters, sourceLabel, catLabel);
    container.hidden = chips.length === 0;
    if (!chips.length) {
      container.innerHTML = '';
      return;
    }
    const chipHtml = chips.map(chip =>
      `<button type="button" class="filter-chip" data-clear-filter="${chip.kind}" title="Turn off ${escapeHtml(chip.label)}">${escapeHtml(chip.label)} ${icon('close', 11)}</button>`,
    ).join('');
    const clearAll = chips.length > 1 ? '<button type="button" class="clear-filters" data-clear-filter="all">Clear filters</button>' : '';
    container.innerHTML = chipHtml + clearAll;
  }
  function markFilters() {
    showImportCategory();
    updateSourceCounts();
    for (const b of el('inventorySources').querySelectorAll<HTMLButtonElement>('button')) {
      b.setAttribute('aria-pressed', String(b.dataset.sourceFilter === filters.source));
    }
    for (const b of el('inventoryCategories').querySelectorAll<HTMLButtonElement>('button')) {
      b.setAttribute('aria-pressed', String(b.dataset.category === filters.category));
    }
    const sourceLabel = sources.find(source => source.id === filters.source)?.label ?? 'All assets';
    const catLabel = filters.category === 'all' ? 'All categories' : categoryLabel(filters.category);
    el('listingTitle').textContent = formatListingTitle(filters, sourceLabel, catLabel);
    renderActiveFilters();
  }
  function counts(total:number, partial:boolean) {
    pages = Math.max(1, Math.ceil(total / perPage));
    el('inventoryPager').hidden = pages <= 1;
    pageInput.value = String(filters.page);
    pageInput.max = String(pages);
    el('pageLimit').textContent = 'of ' + pages.toLocaleString();
    el('inventoryTotal').textContent = total.toLocaleString() + (partial ? ' local' : '') + (total === 1 ? ' asset' : ' assets');
    prev.disabled = filters.page <= 1;
    next.disabled = filters.page >= pages;
    pageInput.disabled = pages === 1;
  }
  function reload(resetScroll:boolean, debounce=false) {
    load?.abort();
    window.clearTimeout(timer);
    window.clearTimeout(retryTimer);
    retryTimer = 0;
    const controller = new AbortController();
    load = controller;
    if (resetScroll) retryPage = undefined;
    const requested = {...filters, page: retryPage ?? filters.page};
    if (resetScroll) el('resultsScroll').scrollTop = 0;
    markFilters();
    el('inventoryNotice').hidden = true;
    const localItems = localBrowseItems(requested,locals);
    const run = async () => {
      const found = await browseAssets(requested,locals,controller.signal);
      if (controller.signal.aborted) return;
      retryPage = found.remoteError ? requested.page : undefined;
      filters.page = found.page;
      results(found.items, found.remoteError ? 'Online results are unavailable.' :
        requested.source === 'saved' && !locals.recipes.length && !locals.imports.length
          ? 'Save a model in the editor to add it to your inventory.' : 'No assets match these filters.');
      grid.setAttribute('aria-busy','false');
      counts(found.total, found.remoteError !== null && found.total === localItems.length);
      if (found.remoteError) {
        el('inventoryNoticeText').textContent = found.remoteError.startsWith('PolyFork') ? found.remoteError : 'Could not load the PolyFork catalog.';
        el('inventoryNotice').hidden = false;
        if (found.retryAfterMs) {
          retryTimer = window.setTimeout(() => {
            if (!controller.signal.aborted && load === controller) {
              expirePolyforkCooldown();
              reload(false);
            }
          }, found.retryAfterMs + 50);
        }
      }
    };
    if (resetScroll || !visible.size) {
      const start = (requested.page - 1) * perPage;
      results(localItems.slice(start,start+perPage), 'Loading assets…');
      el('inventoryTotal').textContent = 'Loading…';
      prev.disabled = next.disabled = pageInput.disabled = true;
    }
    grid.setAttribute('aria-busy','true');
    const fetchResults = () => {
      void run().catch((error:unknown) => {
        if (controller.signal.aborted) return;
        retryPage = requested.page;
        const start = (requested.page - 1) * perPage;
        results(localItems.slice(start, start + perPage), 'Online results are unavailable.');
        grid.setAttribute('aria-busy', 'false');
        counts(localItems.length, true);
        el('inventoryNoticeText').textContent = error instanceof Error && error.message.startsWith('PolyFork')
          ? error.message : 'Could not load the PolyFork catalog.';
        el('inventoryNotice').hidden = false;
        report(error);
      });
    };
    if (debounce) timer = window.setTimeout(fetchResults,280);
    else fetchResults();
  }
  function selectPage(value:number) {
    const selected = Number.isSafeInteger(value) && value > 0 ? Math.min(pages,value) : filters.page;
    pageInput.value = String(selected);
    if (selected === filters.page) return;
    filters.page = selected;
    reload(true);
  }
  function sourcesMarkup() {
    return sources.map(source => {
      const count = source.id === 'original' ? catalog.length : source.id === 'saved' ? locals.recipes.length + locals.imports.length : null;
      return `<button type="button" data-source-filter="${source.id}"><span class="filter-switch" aria-hidden="true"></span>${icon(source.icon,14)}<span class="filter-label">${source.label}</span>${count === null ? '' : `<small>${String(count)}</small>`}</button>`;
    }).join('');
  }
  async function refreshSaved() {
    const revision = ++localsRevision;
    let recipes = locals.recipes, imports = locals.imports;
    try { recipes = readInventory(); } catch (error) { report(error); }
    try { imports = await listImports(); } catch (error) { report(error); }
    if (localsRevision !== revision) return;
    const changed = JSON.stringify([recipes,imports]) !== JSON.stringify([locals.recipes,locals.imports]);
    if (!changed) return;
    locals = { recipes, imports };
    showImportCategory();
    if (pendingKey.startsWith('saved:') && ![...recipes,...imports].some(entry => 'saved:' + entry.id === pendingKey)) {
      opening?.abort();
    }
    updateSourceCounts();
    if (filters.source === 'all' || filters.source === 'saved') reload(false);
  }
  async function selectItem(item: BrowseItem) {
    opening?.abort();
    const controller = new AbortController();
    opening = controller; pendingKey = item.key; markSelection();
    try { await actions.open(item,controller.signal); }
    catch (error) { if (!controller.signal.aborted) report(error); }
    finally { if (opening === controller) { pendingKey=''; markSelection(); } }
  }
  grid.onclick = event => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>('button');
    const item = visible.get(button?.dataset.delete ?? button?.dataset.key ?? '');
    if (!item) return;
    if (button?.dataset.delete && item.source === 'saved') {
      if (!confirm('Delete this saved asset from your inventory?')) return;
      if (pendingKey === item.key) opening?.abort();
      const {entry} = item;
      const remove = async () => {
        if ('recipe' in entry) removeAsset(entry.id);
        else await deleteImport(entry.id);
        actions.deleted(entry.id); previews.delete(item.key);
        await refreshSaved(); notify('Asset removed');
      };
      void remove().catch(report);
    } else void selectItem(item);
  };
  el('inventorySources').innerHTML = sourcesMarkup();
  el('inventoryCategories').innerHTML = `<button type="button" data-category="all"><span class="filter-switch" aria-hidden="true"></span>${icon('layers',14)}<span class="filter-label">All categories</span></button>` +
    categories.map(c => `<button type="button" data-category="${c.id}"><span class="filter-switch" aria-hidden="true"></span>${icon(categoryIcons[c.id],14)}<span class="filter-label">${c.label}</span></button>`).join('');
  el('activeFilters').onclick = event => {
    const kind = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('[data-clear-filter]')?.dataset.clearFilter : undefined;
    if (!kind) return;
    if (kind === 'source' || kind === 'all') filters.source = 'all';
    if (kind === 'category' || kind === 'all') filters.category = 'all';
    if (kind === 'query' || kind === 'all') { filters.query = ''; query.value = ''; }
    filters.page = 1;
    reload(true);
  };
  el('inventorySources').onclick = event=>{
    const id = event.target instanceof Element ? event.target.closest('button')?.dataset.sourceFilter : undefined;
    const source = sources.find(s=>s.id===id); if (!source) return;
    filters.source=source.id; filters.page=1; reload(true);
  };
  el('inventoryCategories').onclick = event=>{
    const id = event.target instanceof Element ? event.target.closest('button')?.dataset.category : undefined;
    const category = id === 'all' ? 'all' : categories.find(c=>c.id===id)?.id;
    if (!category) return;
    filters.category=category; filters.page=1; reload(true);
  };
  query.oninput = ()=>{ filters.query=query.value; filters.page=1; reload(true,true); };
  prev.onclick = ()=>{ selectPage(filters.page-1); };
  next.onclick = ()=>{ selectPage(filters.page+1); };
  el('inventoryPager').onsubmit = event=>{ event.preventDefault(); selectPage(pageInput.valueAsNumber); };
  pageInput.onchange = ()=>{ selectPage(pageInput.valueAsNumber); };
  el('inventoryRetry').onclick = ()=>{ clearPolyforkBackoff(); reload(false); };
  return {
    markSelection,
    refreshSaved,
    start: () => {
      try { locals = { ...locals, recipes: readInventory() }; } catch (error) { report(error); }
      updateSourceCounts();
      reload(true);
      void refreshSaved().catch(report);
    },
  };
}
