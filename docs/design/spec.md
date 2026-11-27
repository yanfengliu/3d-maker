# Form Foundry

## Editor and inventory

The studio targets desktop browsers with WebGL 2. It opens with the full inventory beside an editable Relay Drone. Collections filter studio originals, public PolyFork models and browser-local saves. Categories filter all three sources. Search, previous and next controls, and a page-number field span the filtered inventory. Selecting a card changes the editor while preserving the inventory view. Six procedural starters cover four objects and two humanoid characters. Appearance controls change body and accent colors. Geometry controls change scale, width, surface detail, and standard or HD quality. HD adds authored components, smoother curved geometry and material detail. Each starter has animation clips. Characters use skinned meshes with stable 19-joint rigs at both qualities.

Animated assets start playing when opened. Properties and Animation are both visible beneath the viewport as soon as a model loads. The Animation section lists and searches named clips. Choosing a clip starts it immediately. Space toggles playback in the workspace and preserves normal text entry and dialog controls. Play all clips advances through the full repertoire and wraps to the beginning. Pausing and editing an original keep its current clip and timeline position. For a compatible rig, the studio adds the packaged CC0 humanoid repertoire when the model opens or exports. Both original character rigs use the same repertoire in the standalone SDK. Custom embedded tracks retain their order. The studio previews clips, speed and time, keeps low or stretched poses framed above the floor grid without disturbing the user’s orbit or exported motion, supports camera presets and orbit, and changes the floor grid or wireframe overlay independently of the exported asset. The saved collection stores starter recipes in localStorage. Imported local files and edit metadata share an IndexedDB transaction. For a PolyFork import, the inventory retains the canonical source reference and retrieves the mesh when reopened. Saved assets belong to the browser and origin. Download a recipe or GLB to move work between machines.

## PolyFork and imports

**Remix** starts a new draft from the displayed model and its current edits, including unsaved changes. It preserves camera, animation and playback. The new draft gets its own ID on first save. Later saves update the copy. The same action works through the agent API as `remix(name?)`.

**Model colors** lists the imported mesh’s materials and discrete vertex-color regions. Each region can be repainted or restored independently. For continuous vertex gradients, the material and overall tint remain editable. The inventory stores selected overrides alongside the source, and GLB export bakes the colors into the mesh and materials.

The inventory requests free metadata and thumbnails from PolyFork by category, search term and page. If the service is unavailable, originals and local entries remain browsable and a retry control appears. Selecting a result opens its GLB from the publisher. The importer keeps embedded materials, mesh hierarchy, skeletons and clips. Name, tint, scale, and height are editable. White restores the original paint. The exported scene carries source credit and edit details for a PolyFork import. The local dataset and download scope are recorded in [the dataset guide](../dataset.md).

## Agent and game interfaces

A versioned JSON recipe is the source for an original asset. Agents can read `catalog.json`, `agent-schema.json` and `llms.txt` at the app root. The browser exposes `window.forgeStudio` for reading and applying recipes, saving, listing inventory, playing clips, editing imported assets and exporting binary glTF. The same validated recipes build ordinary three.js Groups in the standalone `studio-sdk.js` module. The README contains a working game integration.

The AI tools panel accepts a structured recipe or a text edit. The natural-language editor uses a supported Chrome installation’s on-device language model when available. The user can explicitly enable a downloadable model. Other browsers support a documented local command vocabulary. The editor identifies which engine applied the edit. Imported GLBs support named-region prompts and JSON settings edits in AI tools as well as the inspector and import edits API.

## Capture contract

`?asset=field-pilot` selects a starter by ID. `?shot=1` starts at rest. Add `&view=Front`, `Top` or `Side` for a fixed preset and `&noui=1` for a full-frame model. The renderer preserves its drawing buffer and sets `window.__shotReady` after five rendered frames. The default perspective shows the model from above its front-right corner.
