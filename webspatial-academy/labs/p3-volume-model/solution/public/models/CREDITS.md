# Model credits

`avocado.glb`: **Avocado** from the Khronos glTF Sample Assets. License: CC0-1.0. Artist: sbtron (Microsoft), 2017.

- Source, pinned to commit `c6a6bd13ab2b3c685c7903d03561b8a9392f38b8`:
  https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@c6a6bd13ab2b3c685c7903d03561b8a9392f38b8/Models/Avocado/glTF-Binary/Avocado.glb
  (8,110,040 bytes; `model/gltf-binary`; curl-verified 2026-09-24)
- License metadata: https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@c6a6bd13ab2b3c685c7903d03561b8a9392f38b8/Models/Avocado/metadata.json
- What we changed: shrank the three 2048px textures to 1024px with
  `npx @gltf-transform/cli@4 resize Avocado.glb avocado.glb --width 1024 --height 1024`.
  That took the file from 8.1 MB to 2.4 MB. The mesh is untouched: 682 triangles, core glTF 2.0, no extensions.
  `gltf-transform validate` reports 0 errors and 0 warnings.
  sha256 `406da890e90d526d6e5550f7bfc94a41af7e1646b1eef67e291842106cd71f00`
- `avocado.jpg` is the asset's own `screenshot/screenshot.jpg` from the same commit. We use it as the poster and the desktop fallback.
