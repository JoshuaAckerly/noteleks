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

    /**
     * Create the static platforms group. Does NOT build any tiles yet.
     * Actual tile creation happens in createPlatforms(), which is called
     * from GameScene.startNextRound() after RoomManager is initialised.
     */
    initialize() {
        this.platforms = this.scene.physics.add.staticGroup();
        // Platform geometry is built in createPlatforms(), called later.
    }

    createPlatforms() {
        const rooms = this.scene.roomManager?.rooms;
        if (rooms && rooms.length > 0) {
            this._generateFromRooms(rooms);
        } else {
            this._generateProcedural();
        }
    }

    /**
     * Room-based generation: one independent layout per room.
     * Each room is ROOM_WIDTH (800 px) wide and contains:
     *  - Solid ground with an optional pit (not in room 0)
     *  - 2–4 floating platforms at three height tiers
     *  - A bridge platform guaranteed above any pit
     */
    _generateFromRooms(rooms) {
        const worldH = GameConfig.world?.height ?? 600;
        const tileW  = GameConfig.assets.textures.ground.width;  // 64
        const tileH  = GameConfig.assets.textures.ground.height; // 32
        const groundY = worldH - tileH / 2;

        rooms.forEach(room => this._buildRoom(room, groundY, tileW, tileH, worldH));
    }

    _buildRoom(room, groundY, tileW, tileH, worldH) {
        const { x: roomX, width: roomW, index } = room;

        // Optional pit (not in the first room; 60 % chance in subsequent rooms)
        const hasPit = index > 0 && Math.random() > 0.4;
        let pitStart = -1, pitEnd = -1;
        if (hasPit) {
            const maxOffset = roomW - 450;
            pitStart = roomX + 200 + Math.floor(Math.random() * Math.max(1, maxOffset));
            pitEnd   = pitStart + 128 + Math.floor(Math.random() * 96);
        }

        // Ground tiles
        for (let tx = roomX; tx < roomX + roomW; tx += tileW) {
            const cx = tx + tileW / 2;
            if (hasPit && cx > pitStart && cx < pitEnd) continue;
            const tile = this.scene.entityFactory.createPlatform(cx, groundY, 'ground');
            this.platforms.add(tile);
        }

        // 3 floating tiers with 170 px centre-to-centre spacing.
        // Clear gap between adjacent tiers = 170 - 32 = 138 px  (player body = 100 px, 38 px headroom).
        // Tier 0 sits ~220 px above ground so the player can walk comfortably underneath.
        const tierY = [worldH - 220, worldH - 390, worldH - 560];
        // Scale platform count to room width: ~1 platform per 400 px plus 0–2 random extras
        const floatCount = 2 + Math.floor(roomW / 400) + Math.floor(Math.random() * 3);
        const placed = [];

        for (let j = 0; j < floatCount; j++) {
            const pw = [128, 192, 256][Math.floor(Math.random() * 3)];
            let attempts = 0;
            while (attempts < 12) {
                const px = roomX + 80 + Math.random() * (roomW - 160);
                const py = tierY[Math.floor(Math.random() * tierY.length)];
                const overlaps = placed.some(
                    p => Math.abs(p.x - px) < (pw / 2 + p.w / 2 + 40) && p.y === py
                );
                if (!overlaps) {
                    placed.push({ x: px, y: py, w: pw });
                    this.createFloatingPlatform(px, py, pw, tileH);
                    break;
                }
                attempts++;
            }
        }

        // Guarantee a bridge above any pit so the room is always crossable
        if (hasPit) {
            const bridgeX = (pitStart + pitEnd) / 2;
            const bridgeY = tierY[1]; // mid tier
            const overlaps = placed.some(
                p => Math.abs(p.x - bridgeX) < (192 / 2 + p.w / 2 + 20) && p.y === bridgeY
            );
            if (!overlaps) {
                this.createFloatingPlatform(bridgeX, bridgeY, 192, tileH);
            }
        }
    }

    // ── Legacy fallback (used when RoomManager is absent, e.g. in tests) ──────
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
        // Tiers match _buildRoom: 170 px spacing, 138 px clear gap (100 px player body + 38 px headroom)
        const tierY = [worldH - 220, worldH - 390, worldH - 560];

        // Bridge platforms: one per pit to ensure it's crossable
        for (const [pitStart, pitEnd] of pitZones) {
            const bridgeX = (pitStart + pitEnd) / 2;
            this.createFloatingPlatform(bridgeX, worldH - 390, 192, tileH);
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
