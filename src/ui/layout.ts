import { icon, type Icon } from './icons';

export function iconButton(id: string, name: Icon, title: string) {
  return `<button type="button" class="square" id="${id}" title="${title}" aria-label="${title}">${icon(name, 17)}</button>`;
}

export const layout = `
<header class="topbar">
  <div class="brand"><img src="./mark.svg" alt=""/><span>Form Foundry</span></div>
  <div class="topactions">
    <button class="btn" id="import">${icon('upload',16)} Import file</button>
    <button class="btn" id="assistant">${icon('spark',16)} AI tools</button>
    <button class="btn dark" id="export">${icon('download',16)} Export asset</button>
  </div>
</header>
<main class="workspace-shell">
  <section id="inventoryPanel" aria-labelledby="inventoryHeading">
    <header class="workspace-heading"><h1 id="inventoryHeading">Inventory</h1><label class="searchbox inventory-search">${icon('search',17)}<input type="search" id="inventorySearch" placeholder="Search inventory…" aria-label="Search inventory" autocomplete="off"/></label></header>
    <div class="inventory-layout">
      <aside class="inventory-nav" aria-label="Filter inventory">
        <nav aria-label="Source filter"><h2 class="micro">SOURCE FILTER</h2><div id="inventorySources"></div></nav>
        <nav aria-label="Category filter"><h2 class="micro">CATEGORY FILTER</h2><div id="inventoryCategories"></div></nav>
      </aside>
      <section class="browser-pane" aria-labelledby="listingTitle">
        <div class="listing-head"><h2 id="listingTitle">All assets</h2><span class="result-count" id="inventoryTotal" aria-live="polite"></span></div>
        <div id="activeFilters" class="active-filters" role="region" aria-label="Active filters" hidden></div>
        <div id="inventoryNotice" class="inventory-notice" role="status" hidden><span id="inventoryNoticeText"></span><button class="textbutton" id="inventoryRetry">Retry</button></div>
        <div class="results-scroll" id="resultsScroll"><div id="assetGrid" aria-label="Inventory assets"></div></div>
        <form id="inventoryPager" class="inventory-pager" aria-label="Inventory pages">
          <button id="inventoryPrev" class="square" type="button" aria-label="Previous page" title="Previous page">${icon('back',16)}</button>
          <label>Page <input type="number" id="inventoryPageNumber" min="1" value="1" aria-label="Page number"/></label><span id="pageLimit">of 1</span>
          <button id="inventoryNext" class="square" type="button" aria-label="Next page" title="Next page">${icon('forward',16)}</button>
        </form>
      </section>
    </div>
  </section>
  <section id="editorPanel" aria-label="Object Studio">
    <header class="workspace-heading editor-heading">
      <div class="model-heading"><h2 id="sceneName">Relay Drone</h2><div class="asset-spec"><span id="assetCode"></span><a id="assetSource" target="_blank" rel="noopener noreferrer" hidden>View on PolyFork ↗</a></div></div>
      <div class="model-actions"><button id="remix" class="btn" title="Start an editable copy">${icon('copy',15)} Remix</button><button id="save" class="btn save-model">${icon('plus',16)} Save to inventory</button></div>
    </header>
    <div class="editor-body">
      <section class="scenePanel" id="scenePanel" aria-label="3D viewport">
        <div id="viewport"></div>
        <div class="viewtop"><div class="viewmenu"><select id="projection" aria-label="Camera projection"><option value="perspective">Perspective</option><option value="orthographic">Orthographic</option></select>${icon('chevron',15)}</div><div class="viewmenu"><select id="view" aria-label="Camera view"><option value="Perspective">3/4 view</option><option value="Front">Front</option><option value="Top">Top</option><option value="Side">Side</option></select>${icon('chevron',15)}</div></div>
        <div class="toolshelf"><button class="view-play" id="play" aria-keyshortcuts="Space" title="Play or pause (Space)" hidden></button><em class="play-divider"></em><button type="button" class="square" id="nightToggle" title="Toggle night lighting" aria-label="Toggle night lighting" aria-pressed="false" hidden>${icon('moon',17)}</button><button type="button" class="square" id="decalToggle" title="Preview decal areas" aria-label="Preview decal areas" aria-pressed="false" hidden>${icon('tag',17)}</button><button type="button" class="square" id="pickColor" title="Click model to pick color" aria-label="Click model to pick color" aria-pressed="false" hidden>${icon('eyedropper',17)}</button>${iconButton('fit','focus','Frame model')}${iconButton('grid','grid','Toggle floor grid')}${iconButton('wire','layers','Toggle wireframe')}<em></em>${iconButton('expand','expand','Expand viewport')}</div>
      </section>
      <section class="inspector" aria-label="Inspector">
        <section class="inspector-section" aria-labelledby="propertiesHeading">
          <header class="inspector-heading"><h2 id="propertiesHeading">Properties</h2>${iconButton('reset','reset','Reset asset properties')}</header>
          <div id="propertiesBody"></div>
        </section>
        <section class="inspector-section" aria-labelledby="animationHeading">
          <header class="inspector-heading"><h2 id="animationHeading">Animation</h2><div class="motion-summary"><span id="motionCount" role="status"></span><button type="button" id="clearMotionSearch" hidden>Show all</button></div></header>
          <div id="animationBody"></div>
        </section>
      </section>
    </div>
  </section>
</main>
<dialog id="dialog"><div class="dialoghead"><h2 id="dialogTitle"></h2>${iconButton('closeDialog','close','Close dialog')}</div><div id="dialogBody"></div></dialog>
<div id="toast" role="status" hidden></div>`;
