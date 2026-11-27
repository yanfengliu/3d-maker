import { icon, type Icon } from './icons';

export function iconButton(id:string, name:Icon, title:string) {
  return `<button type="button" class="square" id="${id}" title="${title}" aria-label="${title}">${icon(name,17)}</button>`;
}

export const layout = `
<header class="topbar"><div class="brand"><img src="./mark.svg" alt=""/><span>Form Foundry</span></div>
  <nav class="topnav" aria-label="Workspace"><button id="navStudio" class="nav active">${icon('studio',17)} Studio</button><button id="navInventory" class="nav">${icon('library',16)} Inventory</button></nav>
  <div class="topactions"><span class="local"><i></i> Local workspace</span><button class="btn dark" id="export">${icon('download',16)} Export asset</button></div>
</header>
<main>
<section id="studioPage">
  <div class="pagehead"><div><div class="eyebrow"><b></b> WORKSPACE <span>/</span> STUDIO</div><h1>Object Studio<span class="title-dot">.</span></h1></div><div class="headbuttons"><button class="btn" id="import">${icon('upload',16)} Import</button><button class="btn ai" id="assistant">${icon('spark',16)} AI tools</button></div></div>
  <div class="desk">
    <section class="scenePanel" id="scenePanel" aria-label="3D viewport">
      <div id="viewport"></div>
      <div class="viewtop"><div class="viewbadge"><i></i> LIVE VIEWPORT</div><div class="viewmenu"><select id="view" aria-label="Camera view"><option>Perspective</option><option>Front</option><option>Top</option><option>Side</option></select>${icon('chevron',15)}</div></div>
      <div class="sceneinfo"><span id="assetCode"></span><strong id="sceneName"></strong></div>
      <div class="toolshelf">${iconButton('fit','focus','Frame model')}${iconButton('grid','grid','Toggle floor grid')}${iconButton('wire','layers','Toggle wireframe')}<em></em>${iconButton('expand','expand','Expand viewport')}</div>
      <div class="viewhint">${icon('mouse',13)} Drag to orbit <span>·</span> Scroll to zoom</div>
    </section>
    <aside class="inspector"><div class="panelhead"><h2>${icon('sliders',19)} Inspector</h2>${iconButton('reset','reset','Reset asset properties')}</div>
    <div class="tabs"><button id="propertiesTab" class="active">Properties</button><button id="animationTab">Animation</button></div>
    <div id="inspectorBody"></div>
    <div class="savebar"><button id="save" class="btn orange">${icon('plus',17)} Save to inventory</button></div></aside>
  </div>
  <section class="shelf"><div class="shelfhead"><div class="sectiontitle"><span class="sectionmark"></span><h2>Asset library</h2><span class="count" id="libraryCount">06</span></div><div class="filters" id="filters"><button data-filter="All" class="active">All assets</button><button data-filter="Object">Objects</button><button data-filter="Character">Characters</button></div></div><div id="starterCards" class="cards"></div><button class="textbutton cataloglink" id="moreCatalog">${icon('globe',15)} Explore PolyFork catalog ${icon('diagonal',14)}</button></section>
</section>
<section id="inventoryPage" hidden><div class="pagehead"><div><div class="eyebrow"><b></b> WORKSPACE <span>/</span> COLLECTION</div><h1>Inventory<span class="title-dot">.</span></h1></div><button id="toStudio" class="btn">${icon('studio',16)} Open studio</button></div>
<div class="inventory-tools"><div class="sectiontitle"><span class="sectionmark"></span><h2>Saved assets</h2><span id="savedCount" class="count">00</span></div><label class="searchbox">${icon('search',16)}<input id="savedQuery" placeholder="Search inventory" aria-label="Search inventory"/></label></div><div id="savedCards" class="inventorycards"></div></section>
</main>
<dialog id="dialog"><div class="dialoghead"><h2 id="dialogTitle"></h2>${iconButton('closeDialog','close','Close dialog')}</div><div id="dialogBody"></div></dialog>
<div id="toast" role="status" hidden></div>`;
