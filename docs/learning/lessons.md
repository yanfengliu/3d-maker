# Studio lessons

Record a trap here when a verified defect changes how the studio should be built or checked.

- An imported GLB can animate an unnamed node by UUID. Exporting a cloned graph must preserve those bindings and snapshot the material settings independently of preview wireframe.
- Browser-local saves can overlap or outlive an open inventory tab. Generate one ID for concurrent first saves and check that the target still exists in the same IndexedDB transaction used to update it.
