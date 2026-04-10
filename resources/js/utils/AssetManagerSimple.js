/*
 * Simplified AssetManager
 *
 * Single supported flow: manifest-driven per-frame WebP sequences.
 * - Loads images listed in manifest.frameSequences
 * - Creates Phaser animations keyed by a normalized name derived from the manifest key
 * - Creates a simple alias map so existing code referencing legacy keys still works
 *
 * This file intentionally omits legacy sidecar/spritesheet/spine self-heal logic.
 */
import GameConfig from '../config/GameConfig.js';
import { ALIAS_MAP, createAlias, createAnimation, promoteFirstFrameTexture } from './AnimationHelper.js';

export class AssetManager {
    /**
     * Create simple placeholder textures declared in GameConfig.assets.textures (optional)
     */
    static createPlaceholderTextures(scene, config) {
        try {
            const textures = (config && config.assets && config.assets.textures) || {};
            Object.entries(textures).forEach(([key, textureConfig]) => {
                try {
                    if (textureConfig && typeof textureConfig.color !== 'undefined') {
                        if (scene.textures.exists(key)) return;
                        const graphics = scene.add.graphics();
                        graphics.fillStyle(textureConfig.color);
                        graphics.fillRect(0, 0, textureConfig.width, textureConfig.height);
                        graphics.generateTexture(key, textureConfig.width, textureConfig.height);
                        graphics.destroy();
                    }
                } catch {
                    // ignore per-texture failures
                }
            });
        } catch {
            // ignore
        }
    }

    // ...existing code...

    /**
     * Queue assets declared in a build-time manifest into the Scene loader.
     * Expected manifest format:
     * {
     *   frameSequences: {
     *     "/games/noteleks/sprites/Skeleton-Idle_": [ "Skeleton-Idle_0.webp", "Skeleton-Idle_01.webp", ... ],
     *     ...
     *   },
     *   sheets: { ... }
     * }
     */
    static queueAssetsFromManifest(scene, manifest, animConfig = {}) {
        try {
            if (!scene || !manifest) return;
            const seqs = manifest.frameSequences || {};
            const sequences = {};

            const makeAnimKey = (baseUrlRaw) => {
                try {
                    return String(baseUrlRaw)
                        .replace(/\/$/, '')
                        .split('/')
                        .pop()
                        .replace(/_$/, '')
                        .replace(/[^a-zA-Z0-9]+/g, '-')
                        .toLowerCase();
                } catch {
                    return null;
                }
            };

            for (const baseUrlRaw of Object.keys(seqs || {})) {
                try {
                    const files = Array.isArray(seqs[baseUrlRaw]) ? seqs[baseUrlRaw] : [];
                    const animKey = makeAnimKey(baseUrlRaw) || 'animation-unknown';
                    sequences[animKey] = files.length || 0;

                    // baseDir: directory portion of the manifest key
                    const baseDir = String(baseUrlRaw).replace(/[^/]*$/, '');

                    for (let i = 0; i < files.length; i++) {
                        try {
                            const fname = files[i];
                            let fullUrl = '';
                            if (typeof fname === 'string' && fname.startsWith('/')) {
                                fullUrl = fname;
                            } else {
                                // default to baseDir + fname which matches how sprites are served
                                fullUrl = baseDir + fname;
                            }
                            const key = `${animKey}-${i}`;
                            scene.load.image(key, fullUrl);
                        } catch {
                            // ignore per-file enqueue failures
                        }
                    }
                } catch {
                    // ignore per-sequence failures
                }
            }

            // Create animations when loader finishes
            try {
                scene.load.once('complete', () => {
                    try {
                        for (const animKey of Object.keys(sequences || {})) {
                            try {
                                const count = sequences[animKey] || 0;
                                if (count <= 0) continue;

                                createAnimation(scene, animKey, count, animConfig[animKey]);
                                promoteFirstFrameTexture(scene, animKey);

                                const alias = ALIAS_MAP[animKey];
                                if (alias) createAlias(scene, animKey, alias, animConfig[animKey]);
                            } catch {
                                /* ignore */
                            }
                        }
                    } catch {
                        /* ignore */
                    }
                });
            } catch {
                /* ignore */
            }
        } catch {
            // ignore top-level failures
        }
    }

    /**
     * Simple helper to enqueue a numeric frame sequence when needed.
     * Kept for compatibility but not used by default if manifest is present.
     */
    static loadFrameSequence(scene, animKey, baseUrl, frameCount, frameRate = 12, repeat = -1) {
        if (!scene || !scene.load) return;
        const frameKeys = [];
        for (let i = 0; i < frameCount; i++) {
            const key = `${animKey}-${i}`;
            frameKeys.push(key);
            try {
                scene.load.image(key, `${baseUrl}${i}.webp`);
            } catch {
                /* ignore */
            }
        }
        try {
            scene.load.once('complete', () => {
                try {
                    if (!scene.anims.exists(animKey)) {
                        const frames = frameKeys.map((k) => ({ key: k }));
                        scene.anims.create({ key: animKey, frames, frameRate, repeat });
                    }
                } catch {
                    /* ignore */
                }
            });
        } catch {
            /* ignore */
        }
    }

    /**
     * Spine setup is intentionally a no-op in the simplified manager. If you
     * enable Spine via `GameConfig.useSpine = true` this function can be
     * expanded to perform plugin-specific cache population. For the simplified
     * flow we return false.
     */
    static setupSpineData(_scene) {
        try {
            if (GameConfig && GameConfig.useSpine === false) return false;
            return false;
        } catch {
            console.log('AssetManagerSimple.setupSpineData: fallback error ignored');
            return;
        }
    }
}
// Developer convenience
try {
    if (typeof window !== 'undefined') window.AssetManager = AssetManager;
} catch {}
export default AssetManager;
