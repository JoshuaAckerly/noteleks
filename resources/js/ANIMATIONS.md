Noteleks — Animation export & runtime steps

This document explains how animations and per-frame assets for Noteleks are exported, named, loaded and debugged. It complements the existing Spine README in `public/games/noteleks/spine/README.md` (that file documents Spine file placement and expected animation names).

1. Source / export (Spine)

- Export skeleton JSON (e.g. `noteleks.json`) using Spine's JSON exporter (LibGDX format is used by our Spine runtimes).
- Export atlas (`.atlas`) and the associated sprite sheet image (`.png`). These are placed under `public/games/noteleks/spine/` and the repository already contains an example README there.

2. Per-frame image sequences (optional runtime fallback)

- Our runtime supports using per-frame WebP images as a fallback when a packed spritesheet/atlas is not used.
- Naming convention used by the codebase:
    - Pattern: `Skeleton-<Anim>_<index>.webp`
    - Examples:
        - `Skeleton-Idle_00.webp` ... `Skeleton-Idle_15.webp` (two-digit padded exporters)
        - `Skeleton-Jump_0.webp` (single-digit exporter)
        - `Skeleton-JumpAttack_0.webp` ... `Skeleton-JumpAttack_7.webp`
- Recommendation: choose one consistent exporter convention across animations (either zero-padded two-digit or plain single-digit). The runtime attempts both padded (`_00`) and plain (`_0`) forms.

3. Sidecar JSON / atlas variants

- The packer/export pipeline may emit different sidecar formats:
    - `skeleton_idle_512.json` (legacy name with `_512`), or
    - `skeleton_idle.json` (no `_512`), or
    - `skeleton_idle.phaser.json` (Phaser-style atlas format)
- The runtime will try several variants in this preferred order to reduce 404s:
    - `skeleton_idle.json` / `.phaser.json` (no `_512`) and `.webp` images are preferred over `_512.png`.

4. Spritesheet / packed atlas generation

- We include `tools/make_spritesheet.js` (see `tools/`) to produce a packed spritesheet from exported frames. This produces a spritesheet and a JSON sidecar used by Phaser.
- When possible, prefer using a single packed spritesheet or atlas (fewer network requests and faster GPU uploads).

5. Loader behavior (runtime) — how AssetManager loads animations

- `GameScene.preload()` calls `AssetManager.loadPlayerSpriteSheets(scene, GameConfig)` which:
    - Queues per-frame WebP sequences (via `loadFrameSequence`) for known animations (idle/run/walk/jumpattack/attack1/attack2/jump).
    - Queues one or more atlas/spritesheet candidates (tries WebP variants and JSON sidecars) and also queues image+sidecar JSON keys.
    - After loader `complete` it creates animations from whichever assets were actually loaded (per-frame textures, generated frames from a sidecar JSON, numeric spritesheet grids, or atlas named frames).
- `loadFrameSequence` probes each candidate frame URL using fetch (HEAD, with GET fallback). It currently probes both padded and plain names and will probe up to a configurable probe limit — this causes 404s for indices that don't exist. See suggestions below to reduce those 404s.

6. Debugging & runtime helpers

- Quick diagnostics available in the browser console:
    - `window._NOTELEKS_ASSET_PROBE` — snapshot populated by `AssetManager` with textures and cache keys.
    - `AssetManager.probeSpineState(scene)` — call from console to get a concise probe of cache/textures/plugin state. Example:
        - `AssetManager.probeSpineState(window.NOTELEKS_LAST_SCENE)`
- Watch the console for diagnostic logs from `AssetManager` (it logs which candidates were queued and if animations were created).

7. Common pitfalls & fixes

- Noisy 404s: caused by `loadFrameSequence` probing beyond the actual frames (the code currently probes up to 16 indices by default). Fixes:
    - Ensure `frameCount` passed to `loadFrameSequence` is correct.
    - Prefer using a packed spritesheet/atlas in production.
    - Consider using a build-time manifest (see next section) to avoid runtime probing.
- Naming mismatches: exporter producing `_512` sidecar names vs runtime expecting no `_512`. The loader prefers `.webp` and no-`_512` variants but will try fallbacks.

8. Recommended next steps (developer workflow)

- Export Spine skeleton & atlas to `public/games/noteleks/spine/`.
- If you want per-frame images: export per-frame `.webp` files into `public/games/noteleks/sprites/` using the `Skeleton-<Anim>_<index>.webp` convention.
- Run `node tools/make_spritesheet.js` (or your repacking tool) to produce a packed spritesheet and JSON sidecar; place outputs under `public/games/noteleks/sprites/`.
- Start the dev server and open the game. Use `AssetManager.probeSpineState(window.NOTELEKS_LAST_SCENE)` to inspect what the loader found.

9. Long-term improvement (manifest)

- Best practice: generate a manifest at build-time that lists exact frame filenames for each animation (JSON). Have the runtime consume the manifest to enqueue exact files (no probing). This eliminates runtime HEAD calls and noisy 404s.

---

Notes: The repository already contains a spine README at `public/games/noteleks/spine/README.md` describing spine file placement and expected animation names. This `ANIMATIONS.md` focuses on the exporter/packer/loader contract and debugging steps for the Noteleks runtime.
