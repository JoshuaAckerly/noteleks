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
        this._generateProcedural();
    }

    _generateProcedural() {
        const worldW = GameConfig.world?.width ?? 3200;
        const worldH = GameConfig.world?.height ?? 600;
        const tileW  = GameConfig.assets.textures.ground.width;  // 64
        const tileH  = GameConfig.assets.textures.ground.height; // 32
        const groundY = worldH - tileH / 2;

        // ── Randomised pit zones ──────────────────────────────────────────────
        // Generate 3-4 pits spaced at least 550 px apart, clear of the
        // start (x < 400) and end (x > 2900) of the world.
        const pitZones = [];
        const numPits = 3 + Math.floor(Math.random() * 2); // 3 or 4
        const pitMinGap = 550;
        const pitMinW = 128;
        const pitMaxW = 224;
        let cursor = 400;

        for (let i = 0; i < numPits && cursor < 2900; i++) {
            cursor += pitMinGap + Math.floor(Math.random() * 350);
            const pitW = pitMinW + Math.floor(Math.random() * (pitMaxW - pitMinW));
            const pitEnd = cursor + pitW;
            if (pitEnd < 2900) {
                pitZones.push([cursor, pitEnd]);
                cursor = pitEnd;
            }
        }

        // ── Ground tiles ──────────────────────────────────────────────────────
        const tilesNeeded = Math.ceil(worldW / tileW) + 1;
        for (let i = 0; i < tilesNeeded; i++) {
            const tileX = i * tileW + tileW / 2;
            if (pitZones.some(([s, e]) => tileX > s && tileX < e)) continue;
            const tile = this.scene.entityFactory.createPlatform(tileX, groundY, 'ground');
            this.platforms.add(tile);
        }

        // ── Floating platforms ────────────────────────────────────────────────
        // Tier heights (y): low=450 mid=370 high=290
        // Place at least one bridge platform over each pit, then scatter extras.
        const tierY = [450, 370, 290];

        // Bridge platforms: one per pit to ensure it's crossable
        for (const [pitStart, pitEnd] of pitZones) {
            const bridgeX = (pitStart + pitEnd) / 2;
            this.createFloatingPlatform(bridgeX, 370, 192, tileH);
        }

        // Scatter platforms across zones (avoid first/last 200 px)
        const zoneW = (worldW - 400) / 4; // 4 zones
        const platformsPerZone = 3 + Math.floor(Math.random() * 3); // 3-5 each

        for (let zone = 0; zone < 4; zone++) {
            const zoneStart = 200 + zone * zoneW;
            for (let j = 0; j < platformsPerZone; j++) {
                const x = zoneStart + 80 + Math.random() * (zoneW - 160);
                const tier = Math.floor(Math.random() * 3);
                const y = tierY[tier];
                const widths = [128, 192, 256];
                const w = widths[Math.floor(Math.random() * 3)];
                this.createFloatingPlatform(x, y, w, tileH);
            }
        }
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
