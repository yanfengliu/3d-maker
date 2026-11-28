import type { AssetController } from '../capabilities/runtime';
import type { ColorwayPresetSpec } from '../capabilities/schema';
import { catalog, getModelParamSpecs, type Recipe } from '../data/recipe';
import { colorwayPaintPatch, listPaintSlots, pickPaintSlot, type ImportedAsset, type ImportEdits } from '../imports';
import { el, notify } from '../ui/dom';
import { showAnimation, showPlayback, showProperties } from '../ui/inspector';
import { showModelPaint } from '../ui/model-paint';
import { showModelParams } from '../ui/model-params';
import { showModelPartsProperties, showRiggedParts, stopPartPreviewAnimation } from '../ui/model-parts';
import type { Viewport } from './viewport';

export interface WorkspaceBridge {
  stage: Viewport;
  getRecipe: () => Recipe | null;
  getImported: () => ImportedAsset | null;
  getController: () => AssetController | null;
  edit: (patch: Partial<Recipe & ImportEdits>) => void;
  selectVariation: (variation: string) => void;
  setImportEdits: (edits: ImportEdits) => void;
  syncRigEdits: () => void;
}

export function createInspectorBridge(host: WorkspaceBridge) {
  let pickMode = false;
  let refreshRigUi: (() => void) | undefined;

  function setPickMode(on: boolean) {
    const imported = host.getImported();
    pickMode = on && Boolean(imported && listPaintSlots(imported).length);
    el('pickColor').setAttribute('aria-pressed', String(pickMode));
    host.stage.setPickHandler(
      pickMode
        ? ({ mesh, faceIndex, materialIndex }) => {
            const active = host.getImported();
            if (!active) return;
            const slotId = pickPaintSlot(active.palette, mesh, faceIndex, materialIndex);
            if (!slotId) { notify('No editable paint slot on that surface.'); return; }
            const selector = document.querySelector<HTMLSelectElement>('#paintSlot');
            if (selector) {
              selector.value = slotId;
              selector.dispatchEvent(new Event('change'));
              selector.focus();
            }
            const slot = active.palette.slots.get(slotId);
            if (slot) notify(`Picked color: ${slot.label}`);
          }
        : null,
    );
  }

  function syncViewportTools() {
    const ctrl = host.getController();
    const caps = ctrl?.capabilities;
    const nightBtn = el<HTMLButtonElement>('nightToggle');
    const hasNight = Boolean(caps?.nightZones.length);
    nightBtn.hidden = !hasNight;
    const nightOn = Boolean(hasNight && ctrl?.isNight());
    nightBtn.setAttribute('aria-pressed', String(nightOn));
    if (host.stage.isNightMode !== nightOn) host.stage.setNightMode(nightOn);

    const decalBtn = el<HTMLButtonElement>('decalToggle');
    const hasDecals = Boolean(caps?.decals.length);
    decalBtn.hidden = !hasDecals;
    decalBtn.setAttribute('aria-pressed', String(Boolean(hasDecals && ctrl?.areDecalsVisible())));

    const pickBtn = el<HTMLButtonElement>('pickColor');
    const imported = host.getImported();
    const canPick = Boolean(imported && listPaintSlots(imported).length);
    pickBtn.hidden = !canPick;
    if (!canPick && pickMode) setPickMode(false);
    pickBtn.setAttribute('aria-pressed', String(pickMode && canPick));
  }

  function applyPreset(preset: ColorwayPresetSpec) {
    const imported = host.getImported();
    if (!imported) return;
    const paint = colorwayPaintPatch(imported.palette, preset, imported.edits.paint);
    host.setImportEdits({ ...imported.edits, paint });
  }

  function renderProperties(keepSlot = false) {
    const recipe = host.getRecipe();
    const imported = host.getImported();
    if (recipe) {
      const entry = catalog.find(row => row.id === recipe.template);
      showProperties(
        {
          ...recipe,
          variation: recipe.variation ?? 'default',
          ...(entry ? { variations: entry.variations } : {}),
        },
        host.edit,
        host.selectVariation,
      );
      showModelParams(
        getModelParamSpecs(recipe.template, recipe.variation),
        recipe.params,
        nextParams => { host.edit({ params: nextParams }); },
      );
      const ctrl = host.getController();
      if (ctrl) {
        showModelPartsProperties(ctrl.capabilities, {
          isVisible: part => ctrl.isVisible(part),
          setVisible: (part, visible) => {
            ctrl.setVisible(part, visible);
            host.stage.invalidate();
          },
          decalText: ctrl.getState().decalText ?? {},
          setDecalText: (slot, text) => {
            const nextText = { ...(ctrl.getState().decalText ?? {}), [slot]: text };
            ctrl.setDecalsVisible(true, nextText);
            syncViewportTools();
            host.stage.invalidate();
          },
        });
      }
      return;
    }
    if (!imported) return;
    const selectedSlot = keepSlot ? document.querySelector<HTMLSelectElement>('#paintSlot')?.value : undefined;
    showProperties({ ...imported.edits, primary: imported.edits.tint }, host.edit);
    showModelPaint(
      listPaintSlots(imported),
      imported.edits.paint,
      paint => { host.edit({ paint }); },
      selectedSlot,
      imported.capabilities.presets,
      applyPreset,
    );
    showModelPartsProperties(imported.capabilities, {
      isVisible: part => imported.controller.isVisible(part),
      setVisible: (part, visible) => {
        const hidden = new Set(imported.edits.hiddenParts ?? []);
        if (visible) hidden.delete(part);
        else hidden.add(part);
        host.edit({ hiddenParts: [...hidden] });
      },
      decalText: imported.edits.decalText ?? {},
      setDecalText: (slot, text) => {
        const nextText = { ...(imported.edits.decalText ?? {}), [slot]: text };
        host.edit({ decalText: nextText });
        syncViewportTools();
      },
    });
  }

  function namePlaybackControl() {
    const clip = host.stage.model?.animations[host.stage.clipIndex];
    if (clip) el('play').title = 'Play or pause ' + clip.name + ' (Space)';
  }

  function renderControls() {
    const clips = host.stage.model?.animations ?? [];
    el('play').hidden = !clips.length;
    showPlayback(host.stage.playing);
    namePlaybackControl();
    renderProperties();
    const markClip = showAnimation(
      clips,
      host.stage.clipIndex,
      host.stage.playing,
      host.stage.speed,
      host.stage.playAll,
      on => {
        if (on) stopPartPreviewAnimation();
        host.stage.playAll = on;
        if (on) host.stage.play(true);
        return host.stage.playing;
      },
      index => {
        stopPartPreviewAnimation();
        host.stage.setClip(index);
        host.stage.seek(0);
        host.stage.play(true);
        namePlaybackControl();
      },
      fraction => {
        stopPartPreviewAnimation();
        host.stage.seek(fraction);
      },
      speed => { host.stage.speed = speed; },
    );
    host.stage.onAdvance = index => { namePlaybackControl(); markClip?.(index); };
    const initialCtrl = host.getController();
    refreshRigUi = showRiggedParts(initialCtrl?.capabilities.riggedParts ?? [], clips.length > 0, {
      getValue: part => host.getController()?.getPart(part) ?? 0,
      setValue: (part, value) => {
        const ctrl = host.getController();
        if (!ctrl) return;
        host.stage.syncExternalPose();
        showPlayback(false);
        ctrl.setPart(part, value);
        host.syncRigEdits();
        host.stage.invalidate();
      },
      toggle: part => {
        const ctrl = host.getController();
        if (!ctrl) return 0;
        host.stage.syncExternalPose();
        showPlayback(false);
        const val = ctrl.togglePart(part);
        host.syncRigEdits();
        host.stage.invalidate();
        return val;
      },
      resetAll: () => {
        const ctrl = host.getController();
        if (!ctrl) return;
        host.stage.syncExternalPose();
        showPlayback(false);
        ctrl.resetParts();
        host.syncRigEdits();
        host.stage.invalidate();
      },
      onAnimateFrame: () => { host.stage.invalidate(); },
    });
  }

  return {
    setPickMode,
    togglePickMode: () => { setPickMode(!pickMode); },
    syncViewportTools,
    applyPreset,
    renderProperties,
    renderControls,
    refreshRig: () => { refreshRigUi?.(); },
  };
}
