# Form Foundry

Browse and edit 3D assets on one desktop page. The inventory combines six studio originals, the free PolyFork catalog and your saved assets. Search by name or choose a category, then select a thumbnail to open it in the adjacent three.js editor. Your search, filters and page stay in place while you customize, animate or export the model.

[Open the studio](https://yanfengliu.github.io/3d-maker/)

## Edit and remix a model

Open an asset and choose **Remix** beside its name. The editor starts a separate draft with your current changes, camera and animation. Give it a name, edit it in **Properties**, then choose **Save to inventory**. Open it again from **Saved** to continue editing the same copy.

On an original, change its colors, proportions, detail or mesh quality. On a PolyFork model or a local GLB, **Model colors** lets you repaint an individual material or an authored vertex-color region, such as a coat or rotor. Use the reset arrow beside the color to restore just that region. **Overall tint** and the size controls affect the whole model. GLB export includes the edited colors, rig and available animation clips.

## Run locally

Use Node 24. Run `npm ci`, then `npm run dev`. For a production build and checks, run `npm run verify` and `npm run check:studio`.

## Character animations

Choose a humanoid. **Properties** and **Animation** appear together beneath the viewport. The first clip plays when an asset opens. Search by motion and click any clip to play it immediately. Choose **Play all clips** to cycle through the whole list. Press **Space** to pause or resume. Pause to scrub a pose. Compatible PolyFork humanoids can use all 85 downloadable CC0 motions. Field Pilot and Survey Bot also keep their two original cycles. Exporting a GLB includes the entire available set even if you never previewed it. Animals, machines and unsupported rigs retain their embedded clips.

[Studio and PolyFork website comparison](docs/design/polyfork-comparison.md) · [Motion source and credits](docs/dataset.md#character-motion-library)

## Use an asset in a game

For a finished mesh, choose **Export asset → GLB**. The file contains the edited materials, geometry, skeleton when present, and animation clips. Load it with three.js GLTFLoader or the glTF importer in your engine.

For runtime customization in a bundled three.js game, copy `dist/studio-sdk.js` into your project after building. It imports your installed copy of `three` (tested with the version in this repository’s lockfile). A recipe exported from the studio can be passed directly to `createAsset`.

```js
import { AnimationMixer } from 'three';
import { catalog, createAsset } from './studio-sdk.js';

const pilot = catalog.find(entry => entry.id === 'field-pilot');
const character = createAsset({ ...pilot.recipe, primary: '#39566b', quality: 'hd' });
scene.add(character);
const mixer = new AnimationMixer(character);
mixer.clipAction(character.animations.find(clip => clip.name === 'Walk')).play();
// In your game's frame update, call mixer.update(deltaSeconds).
```

The six original templates and SDK are available under the [MIT license](LICENSE). For PolyFork’s free assets, its license allows inclusion in commercial games. Its free meshes can also be redistributed under CC BY 4.0 with the source credit and changes indicated. PolyFork’s HD editions use its paid offering. [PolyFork licensing](https://polyfork.dev/licensing)

## Work with an agent

The studio serves `llms.txt`, `agent-schema.json`, and `catalog.json`. Agents can construct recipes, preview them through `window.forgeStudio`, and export GLBs. In **AI tools**, use a compatible Chrome on-device model for free-form instructions, enter a supported local command, or paste recipe JSON.

## Local dataset

Run `npm run dataset` to obtain the public catalog and sample meshes. Run `npm run dataset -- --verify` to verify a completed snapshot offline. Downloaded data stays in the ignored `dataset/polyfork/` directory. [Dataset scope and checksums](docs/dataset.md)
