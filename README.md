# Form Foundry

Browse and edit 3D assets on one desktop page. The inventory combines six studio originals, the free PolyFork catalog and your saved assets. Search by name or choose a category, then select a thumbnail to open it in the adjacent three.js editor. Your search, filters and page stay in place while you customize, animate or export the model.

[Open the studio](https://yanfengliu.github.io/3d-maker/)

## Run locally

Use Node 24. Run `npm ci`, then `npm run dev`. For a production build and checks, run `npm run verify` and `npm run check:studio`.

## Character animations

Choose a humanoid and open **Inspector → Animation**. Search by motion, pick a clip, then play or scrub it. Compatible PolyFork humanoids can use all 85 downloadable CC0 motions. Field Pilot and Survey Bot also keep their two original cycles. Exporting a GLB includes the entire available set even if you never previewed it. Animals, machines and unsupported rigs retain their embedded clips.

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
