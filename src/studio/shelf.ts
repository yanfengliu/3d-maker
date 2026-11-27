import { catalog, type CatalogEntry, type Recipe } from '../data/recipe';
import { readInventory, removeAsset, type SavedAsset } from '../data/inventory';
import { listImports, deleteImport, type ImportEntry } from '../imports';
import { el, escapeHtml, report, notify } from '../ui/dom';
import { icon } from '../ui/icons';
import { thumbnail } from './thumbnails';

const poster = (id:string) =>'./previews/'+id+'.webp';
interface Actions {
  choose:(recipe:Recipe,id?:string)=>void;
  openImport:(id:string)=>Promise<void>;
  active:()=>Recipe|null;
  deleted:(id:string)=>void;
}
export function setupShelf(actions:Actions) {
  let filter='All';
  let sequence=0;
  const previewCache = new Map<string,string>();
  function renderLibrary() {
    const visible = catalog.filter(row=>filter==='All'||row.category===filter);
    el('libraryCount').textContent=String(visible.length).padStart(2,'0');
    el('starterCards').innerHTML=visible.map(row=>card(row)).join('');
    el('starterCards').querySelectorAll<HTMLButtonElement>('[data-kind]').forEach(b=>b.onclick=()=>{
      const item=catalog.find(row=>row.id===b.dataset.kind);
      if(item) actions.choose({...item.recipe});
    });
  }
  function card(row:CatalogEntry) {
    const selected=actions.active()?.template===row.id;
    return `<button class="card ${selected?'selected':''}" data-kind="${row.id}" aria-pressed="${String(selected)}" aria-label="Open ${row.recipe.name}"><div class="cardpic"><img src="${poster(row.id)}" alt=""/></div><div class="cardbottom"><strong>${row.recipe.name}</strong><span class="cardtype">${row.category} <span> / </span> ${row.code}</span></div></button>`;
  }
  el('filters').querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.onclick=()=>{
    filter=b.dataset.filter??'All';el('filters').querySelectorAll('button').forEach(n=>n.classList.toggle('active',n===b));renderLibrary();
  });
  async function refresh() {
    const request=++sequence, query=el<HTMLInputElement>('savedQuery').value.toLowerCase().trim();
    const locals=readInventory();
    let imports:ImportEntry[]=[];
    try { imports=await listImports(); } catch(error) {report(error);}
    if(request!==sequence)return;
    const all=[...locals,...imports].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));
    el('savedCount').textContent=String(all.length).padStart(2,'0');
    const matches=all.filter(v=>('recipe' in v?v.recipe.name:v.name).toLowerCase().includes(query));
    el('savedCards').innerHTML=matches.length?matches.map(asset=>savedCard(asset)).join(''):
      `<div class="empty"><div class="emptyicon">${icon(query?'search':'folder',27)}</div><h2>${query?'No matching assets':'Your inventory is empty'}</h2><p>${query?'Try a different name.':'Open a model in the studio and save it here.'}</p></div>`;
    el('savedCards').querySelectorAll<HTMLElement>('[data-entry]').forEach(item=>{
      const asset=matches.find(a=>a.id===item.dataset.entry);
      if(!asset)return;
      item.querySelector<HTMLButtonElement>('.openasset')?.addEventListener('click',()=>{
        if('recipe' in asset)actions.choose({...asset.recipe},asset.id);
        else void actions.openImport(asset.id).catch(report);
      });
      item.querySelector<HTMLButtonElement>('.deleteasset')?.addEventListener('click',()=>{
        if(!confirm('Delete this saved asset from your inventory?'))return;
        const remove='recipe' in asset?Promise.resolve().then(()=>{removeAsset(asset.id);}):deleteImport(asset.id);
        void remove.then(()=>{actions.deleted(asset.id);notify('Asset removed');return refresh();}).catch(report);
      });
    });
  }
  function savedCard(asset:SavedAsset|ImportEntry) {
    const name='recipe' in asset?asset.recipe.name:asset.name;
    let image:string,type='Imported GLB',kind='import';
    if('recipe' in asset){
      kind=asset.recipe.template;
      type=catalog.find(row=>row.id===kind)?.category??'Object';
      const key=asset.id+'|'+asset.updatedAt;
      let url=previewCache.get(key);
      if(!url){url=thumbnail(asset.recipe);previewCache.set(key,url);}
      image=`<img src="${url}" alt=""/>`;
    }else if(asset.source.kind==='polyfork'){
      type='PolyFork';image=icon('studio',48);
    }else image=icon('studio',48);
    return `<article class="saved" data-entry="${escapeHtml(asset.id)}"><button class="card openasset" data-kind="${kind}"><div class="cardpic">${image}</div><div class="cardbottom"><strong>${escapeHtml(name)}</strong><span class="cardtype">${type}</span></div></button><button class="deleteasset square" title="Delete saved asset" aria-label="Delete ${escapeHtml(name)}">${icon('trash',15)}</button></article>`;
  }
  el<HTMLInputElement>('savedQuery').oninput=()=>void refresh().catch(report);
  return {renderLibrary,refresh};
}
