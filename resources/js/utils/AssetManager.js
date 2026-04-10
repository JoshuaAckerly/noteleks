/**
 * Simplified AssetManager
 *
 * Only supports one animation upload method: manifest-driven per-frame
 * WebP sequences. This reduces runtime complexity and avoids probing/sidecar
 * behaviors. Spine-related helpers are intentionally no-ops when Spine is
 * not enabled via GameConfig.useSpine.
 */
import GameConfig from '../config/GameConfig.js';

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
                        graphics.fillRect(0, 0, textureConfig.width || 32, textureConfig.height || 32);
                        graphics.generateTexture(key, textureConfig.width || 32, textureConfig.height || 32);
                        graphics.destroy();
                        console.log(`[AssetManager] Created placeholder texture '${key}' ${textureConfig.width}x${textureConfig.height}`);
                    }
                } catch {
                    console.error(`[AssetManager] Failed to create texture '${key}':`);
                }
            });
        } catch (e) {
            console.error('[AssetManager] createPlaceholderTextures failed:', e.message);
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
    static queueAssetsFromManifest(scene, manifest) {
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
                        const aliasMap = {
                            'skeleton-idle': 'player-idle',
                            'skeleton-run': 'player-run',
                            'skeleton-walk': 'player-walk',
                            'skeleton-jumpattack': 'player-jump',
                            'skeleton-attack1': 'player-attack',
                            'skeleton-attack2': 'player-attack',
                        };

                        for (const animKey of Object.keys(sequences || {})) {
                            try {
                                const count = sequences[animKey] || 0;
                                if (count <= 0) continue;

                                if (!scene.anims.exists(animKey)) {
                                    const frames = [];
                                    for (let i = 0; i < count; i++) frames.push({ key: `${animKey}-${i}` });
                                    scene.anims.create({ key: animKey, frames, frameRate: 12, repeat: -1 });
                                }

                                // Duplicate first frame into base texture so legacy code
                                // that expects a single texture key (e.g. 'skeleton-idle')
                                // finds something usable for sizing.
                                try {
                                    const firstKey = `${animKey}-0`;
                                    if (scene.textures.exists(firstKey) && !scene.textures.exists(animKey)) {
                                        const srcImg = scene.textures.get(firstKey).getSourceImage();
                                        if (srcImg) scene.textures.addImage(animKey, srcImg);
                                    }
                                } catch {
                                    /* ignore */
                                }

                                // Create alias if mapped
                                const alias = aliasMap[animKey];
                                if (alias && !scene.anims.exists(alias)) {
                                    try {
                                        const baseAnim = scene.anims.get(animKey);
                                        if (baseAnim && baseAnim.frames && baseAnim.frames.length) {
                                            const framesCopy = baseAnim.frames.map((f) => ({
                                                key: f.textureKey,
                                                frame: f.frame ? f.frame.name : f.frame,
                                            }));
                                            scene.anims.create({ key: alias, frames: framesCopy, frameRate: 12, repeat: -1 });
                                        }
                                    } catch {
                                        /* ignore */
                                    }
                                }
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
            console.log('AssetManager.setupSpineData: fallback error ignored');
            return;
        }
    }
}
// Developer convenience
try {
    if (typeof window !== 'undefined') window.AssetManager = AssetManager;
} catch {}
export default AssetManager;
