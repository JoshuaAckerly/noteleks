/**
 * Animation creation helpers for Phaser scenes.
 *
 * Extracted from AssetManager to keep animation logic
 * separate from asset-loading concerns.
 */

/** Default alias map: manifest-derived keys → game-facing keys */
export const ALIAS_MAP = {
    'skeleton-idle': 'player-idle',
    'skeleton-run': 'player-run',
    'skeleton-walk': 'player-walk',
    'skeleton-jump': 'player-jump',
    'skeleton-jumpattack': 'player-jump-attack',
    'skeleton-attack1': 'player-attack',
    'skeleton-attack2': 'player-attack',
};

/**
 * Create a Phaser animation from sequential frame keys.
 *
 * @param {Phaser.Scene} scene
 * @param {string} animKey      - e.g. 'skeleton-idle'
 * @param {number} frameCount   - total frames (keys: animKey-0 … animKey-(n-1))
 * @param {object} [cfg]        - { frameRate, repeat } overrides (defaults: 12, -1)
 * @returns {boolean} true if animation was created
 */
export function createAnimation(scene, animKey, frameCount, cfg = {}) {
    if (!scene || !animKey || frameCount <= 0) return false;
    if (scene.anims.exists(animKey)) return false;

    const frames = [];
    for (let i = 0; i < frameCount; i++) frames.push({ key: `${animKey}-${i}` });

    scene.anims.create({
        key: animKey,
        frames,
        frameRate: cfg.frameRate || 12,
        repeat: cfg.repeat !== undefined ? cfg.repeat : -1,
    });
    return true;
}

/**
 * Create an alias animation that mirrors an existing animation's frames
 * but under a different key (e.g. 'skeleton-idle' → 'player-idle').
 *
 * @param {Phaser.Scene} scene
 * @param {string} sourceKey   - existing animation key
 * @param {string} aliasKey    - new key to create
 * @param {object} [cfg]       - { frameRate, repeat } overrides
 * @returns {boolean} true if alias was created
 */
export function createAlias(scene, sourceKey, aliasKey, cfg = {}) {
    if (!scene || !sourceKey || !aliasKey) return false;
    if (scene.anims.exists(aliasKey)) return false;

    const baseAnim = scene.anims.get(sourceKey);
    if (!baseAnim || !baseAnim.frames || !baseAnim.frames.length) return false;

    const framesCopy = baseAnim.frames.map((f) => ({
        key: f.textureKey,
        frame: f.frame ? f.frame.name : f.frame,
    }));

    scene.anims.create({
        key: aliasKey,
        frames: framesCopy,
        frameRate: cfg.frameRate || 12,
        repeat: cfg.repeat !== undefined ? cfg.repeat : -1,
    });
    return true;
}

/**
 * Duplicate the first frame of an animation into a standalone texture key.
 * Lets legacy code that does `scene.add.sprite(x, y, 'skeleton-idle')` find
 * a valid texture for sizing even when the real asset is a frame sequence.
 *
 * @param {Phaser.Scene} scene
 * @param {string} animKey
 */
export function promoteFirstFrameTexture(scene, animKey) {
    try {
        const firstKey = `${animKey}-0`;
        if (scene.textures.exists(firstKey) && !scene.textures.exists(animKey)) {
            const srcImg = scene.textures.get(firstKey).getSourceImage();
            if (srcImg) scene.textures.addImage(animKey, srcImg);
        }
    } catch {
        /* ignore */
    }
}
