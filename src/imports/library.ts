import type { AssetCapabilities } from '../capabilities/schema';
import { applyImportEdits, openPolyforkGlb, openStoredFile, reconcileSavedEdits, validateEdits } from './asset';
import type { ImportEdits, ImportedAsset, ImportSource } from './asset';
import { publishImportChange } from './changes';

export interface ImportEntry {
  id: string;
  name: string;
  updatedAt: string;
  source: ImportSource;
  edits: ImportEdits;
  /** Cached baseline capabilities so saved PolyFork remixes keep edits even if PolyFork metadata is temporarily unreachable. */
  capabilities?: AssetCapabilities;
}

function connect(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('3d-maker-imports', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('entries', { keyPath: 'id' });
      request.result.createObjectStore('files');
    };
    request.onsuccess = () => { resolve(request.result); };
    request.onerror = () => { reject(request.error ?? new Error('Could not open the imported inventory.')); };
  });
}

/** Always wait for commit. A successful individual put can still be rolled back (e.g. quota). */
async function transact<T>(stores: string[], mode: IDBTransactionMode, work: (tx: IDBTransaction) => () => T): Promise<T> {
  const db = await connect();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(stores, mode);
      tx.onabort = () => { reject(tx.error ?? new Error('The inventory change was interrupted.')); };
      tx.onerror = () => { reject(tx.error ?? new Error('Could not access the imported inventory.')); };
      try {
        const result = work(tx);
        tx.oncomplete = () => { resolve(result()); };
      } catch (error) {
        tx.abort();
        reject(error instanceof Error ? error : new Error('Invalid inventory data.'));
      }
    });
  } finally {
    db.close();
  }
}

function capabilitySnapshot(asset: ImportedAsset): AssetCapabilities | undefined {
  if (asset.source.kind !== 'polyfork') return undefined;
  const copy = structuredClone(asset.capabilities);
  delete copy.state;
  if (asset.baseColorZones?.length) copy.colorZones = structuredClone(asset.baseColorZones);
  if (asset.baseNightZones.length) copy.nightZones = structuredClone(asset.baseNightZones);
  if (asset.baseDimensions) copy.dimensions = structuredClone(asset.baseDimensions);
  return copy;
}

export async function saveImport(asset: ImportedAsset, id?: string): Promise<ImportEntry> {
  const carried = asset.preservedUnavailableEdits;
  const mergedEdits: ImportEdits = carried ? {
    ...asset.edits,
    ...(carried.paint || asset.edits.paint ? { paint: { ...(carried.paint ?? {}), ...(asset.edits.paint ?? {}) } } : {}),
    ...(carried.pose || asset.edits.pose ? { pose: { ...(carried.pose ?? {}), ...(asset.edits.pose ?? {}) } } : {}),
    ...(carried.hiddenParts || asset.edits.hiddenParts ? { hiddenParts: [...new Set([...(carried.hiddenParts ?? []), ...(asset.edits.hiddenParts ?? [])])] } : {}),
    ...(carried.night || asset.edits.night ? { night: true } : {}),
    ...(carried.decalText || asset.edits.decalText ? { decalText: { ...(carried.decalText ?? {}), ...(asset.edits.decalText ?? {}) } } : {}),
  } : asset.edits;
  const edits = validateEdits(mergedEdits);
  const capabilities = capabilitySnapshot(asset);
  const entry: ImportEntry = {
    id: id ?? crypto.randomUUID(),
    name: edits.name,
    edits,
    source: { ...asset.source },
    updatedAt: new Date().toISOString(),
    ...(capabilities ? { capabilities } : {}),
  };
  if (asset.source.kind === 'local' && !asset.originalFile) throw new Error('The original file is missing.');
  const saved = await transact(['entries', 'files'], 'readwrite', tx => {
    const entries = tx.objectStore('entries');
    function storeFile() {
      const files = tx.objectStore('files');
      if (asset.source.kind === 'local') files.put(asset.originalFile, entry.id);
      else files.delete(entry.id);
    }
    if (id === undefined) {
      entries.add(entry);
      storeFile();
      return () => true;
    }
    // A cursor updates only an existing record in this transaction. An older tab cannot recreate a deleted item.
    const existing = entries.openCursor(id);
    existing.onsuccess = () => {
      const cursor = existing.result;
      if (cursor) {
        cursor.update(entry);
        storeFile();
      }
    };
    return () => existing.result !== null;
  });
  if (!saved) throw new Error('This imported asset is no longer in your inventory.');
  publishImportChange({ kind: 'saved', id: entry.id });
  return entry;
}

export async function listImports(): Promise<ImportEntry[]> {
  const entries = await transact(['entries'], 'readonly', tx => {
    const request = tx.objectStore('entries').getAll() as IDBRequest<ImportEntry[]>;
    return () => request.result;
  });
  return entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function openSavedImport(id: string, signal?: AbortSignal): Promise<ImportedAsset> {
  const { entry, file } = await transact(['entries', 'files'], 'readonly', tx => {
    const entryRequest = tx.objectStore('entries').get(id) as IDBRequest<ImportEntry | undefined>;
    const fileRequest = tx.objectStore('files').get(id) as IDBRequest<Blob | undefined>;
    return () => ({ entry: entryRequest.result, file: fileRequest.result });
  });
  if (!entry) throw new Error('This imported asset is no longer in your inventory.');
  const { source } = entry;
  let asset: ImportedAsset;
  if (source.kind === 'polyfork') {
    asset = await openPolyforkGlb(source.assetId, source.title, signal, source.category, entry.capabilities);
  } else {
    if (!file) throw new Error('The saved GLB file is missing.');
    asset = await openStoredFile(file, source.filename);
  }
  const { edits, dropped } = reconcileSavedEdits(asset, entry.edits);
  applyImportEdits(asset, edits);
  if (dropped.length) asset.droppedPaintSlots = dropped;
  return asset;
}

export async function deleteImport(id: string): Promise<void> {
  await transact(['entries', 'files'], 'readwrite', tx => {
    tx.objectStore('entries').delete(id);
    tx.objectStore('files').delete(id);
    return () => undefined;
  });
  publishImportChange({ kind: 'removed', id });
}
