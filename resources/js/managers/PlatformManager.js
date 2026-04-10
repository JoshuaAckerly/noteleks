import GameConfig from '../config/GameConfig.js';

/**
 * Platform Manager
 * Handles creation and management of game platforms/terrain
 */
export class PlatformManager {
    constructor(scene) {
        this.scene = scene;
        this.platforms = null;
    }

    initialize() {
        this.platforms = this.scene.physics.add.staticGroup();
        this.createPlatforms();
    }

    createPlatforms() {
        const worldW = GameConfig.world?.width ?? 3200;
        const worldH = GameConfig.world?.height ?? 600;
        const tileW  = GameConfig.assets.textures.ground.width;  // 64
        const tileH  = GameConfig.assets.textures.ground.height; // 32
        const groundY = worldH - tileH / 2;

        // ── Ground with pits ──────────────────────────────────────────────────
        // Each entry is [startX, endX] of a gap (world px coords).
        const pitZones = [
            [ 896, 1088],   // Zone 1  – 192 px pit
            [1728, 1920],   // Zone 2a – 192 px pit
            [2304, 2496],   // Zone 2b – 192 px pit
            [2752, 2880],   // Zone 3  – 128 px pit
        ];

        const tilesNeeded = Math.ceil(worldW / tileW) + 1;
        for (let i = 0; i < tilesNeeded; i++) {
            const tileX = i * tileW + tileW / 2;
            if (pitZones.some(([s, e]) => tileX > s && tileX < e)) continue;
            const tile = this.scene.entityFactory.createPlatform(tileX, groundY, 'ground');
            this.platforms.add(tile);
        }

        // ── Floating platforms ────────────────────────────────────────────────
        // Physics: gravity 500, jumpPower 520 → single jump max height ≈ 270 px
        //          double jump adds ≈ 176 px → total ≈ 446 px from take-off
        // Tier heights (y value, lower = higher on screen):
        //   Low  y=450  gap≈118 px  – tiny hop or walk-on
        //   Mid  y=370  gap≈198 px  – comfortable single jump
        //   High y=290  gap≈278 px  – tight single jump / easy double jump
        const floaters = [
            // ── Zone 0: Tutorial (x 0–800) ──────────────────────────────────
            { x:  250, y: 450, w: 192 },
            { x:  500, y: 370, w: 128 },
            { x:  660, y: 290, w: 192 },  // reach via 370 platform

            // ── Zone 1: First pit (x 800–1600) ──────────────────────────────
            { x:  840, y: 450, w: 128 },
            { x:  980, y: 370, w: 192 },  // bridge over pit 1
            { x: 1140, y: 450, w: 128 },
            { x: 1310, y: 290, w: 192 },
            { x: 1490, y: 390, w: 128 },

            // ── Zone 2: Two pits (x 1600–2400) ──────────────────────────────
            { x: 1650, y: 420, w: 128 },
            { x: 1820, y: 460, w: 192 },  // bridge over pit 2a
            { x: 2010, y: 310, w: 128 },
            { x: 2200, y: 440, w: 192 },
            { x: 2400, y: 360, w: 128 },

            // ── Zone 3: Advanced (x 2400–3200) ──────────────────────────────
            { x: 2590, y: 440, w: 192 },
            { x: 2760, y: 360, w: 128 },  // bridge over pit 3
            { x: 2950, y: 290, w: 256 },  // high platform / mini-boss area
            { x: 3100, y: 420, w: 192 },
            { x: 3160, y: 300, w: 128 },  // final challenge
        ];

        floaters.forEach(({ x, y, w }) => this.createFloatingPlatform(x, y, w, tileH));
    }

    createFloatingPlatform(x, y, width = 64, height = 32) {
        const overrides = {};

        if (width !== 64 || height !== 32) {
            const scaleX = width / GameConfig.assets.textures.ground.width;
            const scaleY = height / GameConfig.assets.textures.ground.height;
            overrides.scale = { x: scaleX, y: scaleY };
        }

        const platform = this.scene.entityFactory.createPlatform(x, y, 'floating', overrides);
        this.platforms.add(platform);

        return platform;
    }

    addCustomPlatform(x, y, width, height, texture = 'ground') {
        const scaleX = width / GameConfig.assets.textures.ground.width;
        const scaleY = height / GameConfig.assets.textures.ground.height;

        const overrides = {
            sprite: texture,
            scale: { x: scaleX, y: scaleY },
        };

        const platform = this.scene.entityFactory.createPlatform(x, y, 'ground', overrides);
        this.platforms.add(platform);

        return platform;
    }

    getPlatforms() {
        return this.platforms;
    }

    removePlatform(platform) {
        if (this.platforms && platform) {
            this.platforms.remove(platform);
            platform.destroy();
        }
    }

    clearAllPlatforms() {
        if (this.platforms) {
            this.platforms.clear(true, true);
        }
    }

    reset() {
        this.clearAllPlatforms();
        this.initialize();
    }

    shutdown() {
        this.clearAllPlatforms();
    }
}

export default PlatformManager;
