import type { AssetController } from '../capabilities/runtime';
import type { AssetCapabilities, ColorwayPresetSpec } from '../capabilities/schema';
import { catalog, listVariations, type Recipe } from '../data/recipe';
import { readInventory } from '../data/inventory';
import { listImports, type ImportedAsset, type ImportEdits } from '../imports';
import { showPlayback } from '../ui/inspector';
import { stopPartPreviewAnimation } from '../ui/model-parts';
import type { ExportOptions } from './export';
import type { Projection } from './projection';
import type { View, Viewport } from './viewport';

export interface PaintSlotSummary {
  id: string;
  label: string;
  color: string;
  originalColor: string;
  zoneName?: string;
}

export interface StudioHost {
  stage: Viewport;
  getRecipe: () => Recipe | null;
  getImported: () => ImportedAsset | null;
  getController: () => AssetController | null;
  applyRecipe: (input: unknown) => Promise<void> | void;
  selectVariation: (variation: string, template?: string) => Promise<void> | void;
  remix: (name?: string) => void;
  save: () => Promise<string>;
  exportGLB: (options?: ExportOptions) => Promise<ArrayBuffer>;
  openPolyfork: (id: string, title: string, signal?: AbortSignal) => Promise<void>;
  listPaintSlots: () => PaintSlotSummary[];
  getImportEdits: () => ImportEdits | null;
  setImportEdits: (edits: ImportEdits) => void;
  listClips: () => { name: string; duration: number }[];
  playClip: (index: number) => void;
  syncRigEdits: () => void;
  refreshRig: () => void;
  syncViewportTools: () => void;
  applyPreset: (preset: ColorwayPresetSpec) => void;
  setProjection: (projection: Projection) => void;
  setView: (view: View) => void;
}

export function createAgentApi(host: StudioHost) {
  function requireController(): AssetController {
    const ctrl = host.getController();
    if (!ctrl) throw new Error('No active model.');
    return ctrl;
  }
  function posePart(action: (ctrl: AssetController) => number): number {
    const ctrl = requireController();
    stopPartPreviewAnimation();
    host.stage.syncExternalPose();
    showPlayback(false);
    const applied = action(ctrl);
    host.syncRigEdits();
    host.refreshRig();
    host.stage.invalidate();
    return applied;
  }

  return {
    listTemplates: () => structuredClone(catalog),
    listVariations: (template?: string) => structuredClone(listVariations(template)),
    getRecipe: host.getRecipe,
    applyRecipe: host.applyRecipe,
    selectVariation: host.selectVariation,
    remix: host.remix,
    save: host.save,
    listInventory: async () => [...readInventory(), ...(await listImports())],
    exportGLB: host.exportGLB,
    openPolyfork: host.openPolyfork,
    listPaintSlots: host.listPaintSlots,
    getImportEdits: host.getImportEdits,
    setImportEdits: host.setImportEdits,
    listClips: host.listClips,
    playClip: host.playClip,
    getProjection: () => host.stage.getProjection(),
    setProjection: (projection: Projection) => { host.setProjection(projection); },
    setView: (view: View) => { host.setView(view); },
    inspectModel: (): (AssetCapabilities & { paintSlots: PaintSlotSummary[] }) | null => {
      const ctrl = host.getController();
      return ctrl ? { ...ctrl.syncManifest(), paintSlots: host.listPaintSlots() } : null;
    },
    listParts: () => {
      const ctrl = host.getController();
      if (!ctrl) return { rigged: [], detachable: [] };
      return {
        rigged: ctrl.capabilities.riggedParts.map(p => ({ ...p, value: ctrl.getPart(p.name) })),
        detachable: ctrl.capabilities.detachableParts.map(p => ({ ...p, visible: ctrl.isVisible(p.name) })),
      };
    },
    setPartPose: (part: string, value: number) => posePart(ctrl => ctrl.setPart(part, value)),
    openPart: (part: string) => posePart(ctrl => ctrl.openPart(part)),
    closePart: (part: string) => posePart(ctrl => ctrl.closePart(part)),
    setPartVisible: (part: string, visible: boolean) => {
      const ctrl = requireController();
      const imported = host.getImported();
      if (imported) {
        const hidden = new Set(imported.edits.hiddenParts ?? []);
        if (visible) hidden.delete(part);
        else hidden.add(part);
        host.setImportEdits({ ...imported.edits, hiddenParts: [...hidden] });
      } else {
        ctrl.setVisible(part, visible);
        host.stage.invalidate();
      }
    },
    setNightMode: (on: boolean) => {
      const ctrl = requireController();
      if (!ctrl.capabilities.nightZones.length) throw new Error('This model has no night lighting zones.');
      const imported = host.getImported();
      if (imported) host.setImportEdits({ ...imported.edits, night: on });
      else {
        ctrl.setNight(on);
        host.syncViewportTools();
      }
    },
    applyColorway: (presetName: string) => {
      const imported = host.getImported();
      if (!imported) throw new Error('Open an imported model with colorways first.');
      const preset = imported.capabilities.presets?.find(p =>
        p.name.toLowerCase() === presetName.toLowerCase() || p.label.toLowerCase() === presetName.toLowerCase());
      if (!preset) throw new Error('Unknown colorway: ' + presetName);
      host.applyPreset(preset);
    },
  };
}

export type ForgeStudioApi = ReturnType<typeof createAgentApi>;
