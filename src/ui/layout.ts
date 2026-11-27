import { icon, type Icon } from './icons';

export function iconButton(id: string, name: Icon, title: string) {
  return `<button type="button" class="square" id="${id}" title="${title}" aria-label="${title}">${icon(name, 17)}</button>`;
}

export const layout = `
<header class="topbar">
  <div class="brand"><img src="./mark.svg" alt=""/><span>Form Foundry</span></div>
  <span class="workspace-label">Studio</span>
  <div class="topactions">
    <span class="local"><i></i> Local workspace</span>
    <button class="btn" id="import">${icon('upload',16)} Import file</button>
    <button class="btn ai" id="assistant">${icon('spark',16)} AI tools</button>
    <button class="btn dark" id="export">${icon('download',16)} Export asset</button>
  </div>
</header>
<main class="workspace-shell">
  <section id="inventoryPanel" aria-labelledby="inventoryHeading">
    <header class="workspace-heading"><h1 id="inventoryHeading">Inventory<span class="title-dot">.</span></h1></header>
    <div class="inventory-layout">
      <aside class="inventory-nav" aria-label="Filter inventory">
        <nav aria-label="Collections"><h2 class="micro">COLLECTIONS</h2><div id="inventorySources"></div></nav>
        <nav aria-label="Categories"><h2 class="micro">CATEGORIES</h2><div id="inventoryCategories"></div></nav>
      </aside>
      <section class="browser-pane" aria-labelledby="listingTitle">
        <label class="searchbox inventory-search">${icon('search',17)}<input type="search" id="inventorySearch" placeholder="Search inventory…" aria-label="Search inventory" autocomplete="off"/></label>
        <div class="listing-head"><h2 id="listingTitle">All assets</h2><span class="result-count" id="inventoryTotal" aria-live="polite"></span></div>
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
      <div><div class="eyebrow"><b></b> OBJECT STUDIO</div><h2 id="sceneName">Relay Drone</h2></div>
      <div class="asset-spec"><span id="assetCode"></span><a id="assetSource" target="_blank" rel="noopener noreferrer" hidden>View on PolyFork ↗</a></div>
    </header>
    <div class="editor-body">
      <section class="scenePanel" id="scenePanel" aria-label="3D viewport">
        <div id="viewport"></div>
        <div class="viewtop"><div class="viewbadge"><i></i> LIVE VIEWPORT</div><div class="viewmenu"><select id="view" aria-label="Camera view"><option>Perspective</option><option>Front</option><option>Top</option><option>Side</option></select>${icon('chevron',15)}</div></div>
        <div class="toolshelf">${iconButton('fit','focus','Frame model')}${iconButton('grid','grid','Toggle floor grid')}${iconButton('wire','layers','Toggle wireframe')}<em></em>${iconButton('expand','expand','Expand viewport')}</div>
      </section>
      <section class="inspector" aria-label="Inspector">
        <div class="panelhead"><h2>${icon('sliders',18)} Inspector</h2><div class="tabs"><button id="propertiesTab" class="active">Properties</button><button id="animationTab">Animation</button></div>${iconButton('reset','reset','Reset asset properties')}</div>
        <div id="inspectorBody"></div>
        <div class="savebar"><button id="save" class="btn orange">${icon('plus',17)} Save to inventory</button></div>
      </section>
    </div>
  </section>
</main>
<dialog id="dialog"><div class="dialoghead"><h2 id="dialogTitle"></h2>${iconButton('closeDialog','close','Close dialog')}</div><div id="dialogBody"></div></dialog>
<div id="toast" role="status" hidden></div>`;
