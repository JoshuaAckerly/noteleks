/* global Phaser */
import GameConfig from '../config/GameConfig.js';
import EnemyManager from '../managers/EnemyManager.js';
import AssetManager from '../utils/AssetManagerSimple.js';
import { GameStateUtils } from '../utils/GameUtils.js';

import EntityFactory from '../factories/EntityFactory.js';
import GameUI from '../GameUI.js';
import PhysicsManager from '../managers/PhysicsManager.js';
import PlatformManager from '../managers/PlatformManager.js';
import TouchInputManager from '../managers/TouchInputManager.js';
import SystemManager from '../systems/SystemManager.js';
import WeaponManager from '../WeaponManager.js';
import ParticleManager from '../managers/ParticleManager.js';

/**
 * Minimal, robust GameScene replacement.
 * Keeps Spine opt-out via GameConfig.useSpine and wires AssetManager fallbacks.
 */
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });

        this.gameState = GameStateUtils.STATES.LOADING;
        this.player = null;
        this.enemyManager = null;

        this.platformManager = null;
        this.physicsManager = null;
        this.weaponManager = null;
        this.particleManager = null;
        this.gameUI = null;
        this.inputManager = null;

        this.systemManager = new SystemManager(this);
        this.entityFactory = new EntityFactory(this);

        // --- ROUND SYSTEM ---
        this.currentRound = 1;
        this.maxRounds = 10;
        this.enemiesToSpawn = 0;
        this.enemiesSpawnedThisRound = 0;
        this.roundActive = false;
        this.roundInTransition = false;
    }

    preload() {
        this.showLoadingScreen();

        // Note: asset loading is handled by LoadingScene. GameScene.preload
        // keeps spine raw asset queuing in case GameScene is started directly
        // (defensive), but avoid re-queuing player sprites here.

        // Queue Spine raw assets only when configured.
        if (
            GameConfig &&
            GameConfig.useSpine &&
            GameConfig.assets &&
            GameConfig.assets.spine &&
            typeof this.load.spineBinary === 'function' &&
            typeof this.load.spineAtlas === 'function'
        ) {
            try {
                this.load.spineBinary(GameConfig.assets.spine.dataKey, GameConfig.assets.spine.skel);
                this.load.spineAtlas(GameConfig.assets.spine.atlasKey, GameConfig.assets.spine.atlas);
            } catch {
                /* ignore */
            }
        }

        if (GameConfig && GameConfig.useSpine) {
            this.load.once('complete', () => {
                try {
                    AssetManager.setupSpineData(this);
                } catch {
                    console.warn('[GameScene] setupSpineData failed on loader complete');
                }
            });
        }
    }

    async create() {
        this.gameState = GameStateUtils.STATES.PLAYING;

        // expose for debugging
        if (typeof window !== 'undefined') window.NOTELEKS_LAST_SCENE = this;

        // try an early setup (no-op if spine disabled)
        if (GameConfig && GameConfig.useSpine) {
            try {
                AssetManager.setupSpineData(this);
            } catch {
                /* ignore */
            }
        }
        this.initializeManagers();
        this.createGameWorld();
        await this.setupGameObjects();
        try {
            this.setupCamera();
        } catch {
            /* ignore */
        }
        try {
            this._ensurePlayerAnimatedFallback();
        } catch {
            /* ignore */
        }
        this.setupCollisions();
        this.registerInputHandlers();
        this.startGame();
        this.startNextRound();
        try {
            this.events.emit('noteleks:scene-ready');
        } catch {
            /* ignore */
        }
    }

    _ensurePlayerAnimatedFallback() {
        try {
            const tryCreate = () => {
                try {
                    if (!this || !this.anims) return false;
                    if (!this.anims.exists || !this.anims.exists('player-idle')) return false;
                    const p = typeof window !== 'undefined' ? window.noteleksPlayer : null;
                    if (!p || !p.sprite) return false;
                    if (GameConfig.useSpine && p.spineObject) return true;

                    // Avoid recreating
                    if (p._persistentFallbackSprite && p._persistentFallbackSprite.scene) return true;

                    const fx =
                        p.sprite && typeof p.sprite.x === 'number'
                            ? p.sprite.x
                            : (this.cameras && this.cameras.main && this.cameras.main.centerX) || 0;
                    const fy =
                        p.sprite && typeof p.sprite.y === 'number'
                            ? p.sprite.y
                            : (this.cameras && this.cameras.main && this.cameras.main.centerY) || 0;

                    let baseTex = null;
                    if (this.textures.exists('skeleton-idle-frame-0')) baseTex = 'skeleton-idle-frame-0';
                    else if (this.textures.exists('skeleton-idle')) baseTex = 'skeleton-idle';
                    else if (this.textures.exists('skeleton')) baseTex = 'skeleton';

                    const spr = this.add.sprite(fx, fy, baseTex || null).setOrigin(0.5, 1);
                    try {
                        // Prefer the Player's applied scale (which may be an override from setDisplayHeight)
                        const baseScale =
                            p && typeof p.getAppliedScale === 'function'
                                ? p.getAppliedScale()
                                : GameConfig && GameConfig.player && typeof GameConfig.player.scale === 'number'
                                  ? GameConfig.player.scale
                                  : 1;
                        if (spr && typeof spr.setScale === 'function') spr.setScale(baseScale);
                    } catch {
                        /* ignore */
                    }
                    try {
                        if (spr && spr.play) spr.play('player-idle');
                    } catch {
                        /* ignore */
                    }
                    if (spr && spr.setDepth) spr.setDepth(501);
                    try {
                        if (p.sprite && typeof p.sprite.setVisible === 'function') p.sprite.setVisible(false);
                    } catch {
                        /* ignore */
                    }
                    p._persistentFallbackSprite = spr;
                    // If a precise target pixel height is configured, ask the Player
                    // to compute and apply the final scale so the on-screen height
                    // matches exactly (this handles timing races where AssetManager
                    // prepared animations after the Player constructor ran).
                    try {
                        if (GameConfig && GameConfig.player && GameConfig.player.targetPixelHeight && p && typeof p.setDisplayHeight === 'function')
                            p.setDisplayHeight(GameConfig.player.targetPixelHeight);
                    } catch {
                        /* ignore */
                    }
                    console.info('[GameScene] Created persistent animated fallback for player (player-idle) using', baseTex);
                    return true;
                } catch {
                    return false;
                }
            };

            // Try right away, then poll briefly if needed
            tryCreate();
            if (!tryCreate()) {
                let attempts = 0;
                const iv = setInterval(() => {
                    attempts += 1;
                    try {
                        if (tryCreate()) {
                            clearInterval(iv);
                            return;
                        }
                    } catch {
                        /* ignore */
                    }
                    if (attempts >= 30) clearInterval(iv);
                }, 200);
            }
        } catch {
            /* ignore */
        }
    }

    initializeManagers() {
        this.enemyManager = new EnemyManager(this);
        this.physicsManager = new PhysicsManager(this);
        this.platformManager = new PlatformManager(this);

        this.weaponManager = new WeaponManager(this);
        this.particleManager = new ParticleManager(this);
        this.inputManager = new TouchInputManager(this);
        this.gameUI = new GameUI(this);

        try {
            this.systemManager.registerSystem('weaponManager', this.weaponManager);
            this.systemManager.registerSystem('inputManager', this.inputManager);
            this.systemManager.registerSystem('gameUI', this.gameUI);
            this.systemManager.initialize();
        } catch {
            /* ignore */
        }
    }

    createGameWorld() {
        const worldW = GameConfig.world?.width  ?? 3200;
        const worldH = GameConfig.world?.height ?? 600;
        try {
            this.physics.world.setBounds(0, 0, worldW, worldH);
            // Open the bottom boundary so players and enemies fall through pits
            this.physics.world.checkCollision.down = false;
        } catch {
            /* ignore */
        }
        try {
            AssetManager.createPlaceholderTextures(this, GameConfig);
        } catch {
            /* ignore */
        }
        try {
            this.createBasicAnimations();
        } catch {
            /* ignore */
        }
        try {
            this.createParallaxBackground();
        } catch {
            /* ignore */
        }

        try {
            this.platformManager.initialize();
        } catch {
            /* ignore */
        }
        try {
            this.platforms = this.platformManager.getPlatforms();
        } catch {
            this.platforms = null;
        }
        try {
            this.enemyManager.initialize();
        } catch {
            /* ignore */
        }
    }

    // ── Camera ────────────────────────────────────────────────────────────────
    setupCamera() {
        if (!this.player?.sprite) return;
        const worldW = GameConfig.world?.width  ?? 3200;
        const worldH = GameConfig.world?.height ?? 600;
        this.cameras.main.setBounds(0, 0, worldW, worldH);
        // Smooth follow with gentle lerp (0 = instant, 1 = no follow)
        this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    }

    // ── Parallax background layers ────────────────────────────────────────────
    createParallaxBackground() {
        const sw = this.scale.width;
        const sh = this.scale.height;

        // Sky — solid rectangle pinned to screen
        const sky = this.add.rectangle(sw / 2, sh / 2, sw, sh, 0x1a1a2e);
        sky.setScrollFactor(0);
        sky.setDepth(-200);

        // Far layer: distant pillars (parallax ×0.15)
        if (!this.textures.exists('bg-far')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x16213e);
            g.fillRect(0, 0, 400, sh);
            g.fillStyle(0x0d1a2a);
            for (let px = 60; px < 400; px += 90) {
                g.fillRect(px,      sh * 0.12, 14, sh * 0.78); // shaft
                g.fillRect(px - 8,  sh * 0.08, 30, 18);        // cap
            }
            g.generateTexture('bg-far', 400, sh);
            g.destroy();
        }
        this.bgFar = this.add.tileSprite(sw / 2, sh / 2, sw, sh, 'bg-far');
        this.bgFar.setScrollFactor(0);
        this.bgFar.setDepth(-190);

        // Mid layer: tombstone silhouettes (parallax ×0.4)
        const midH = 110;
        if (!this.textures.exists('bg-mid')) {
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x1e1e2e);
            g.fillRect(0, 0, 300, midH);
            [[30, 16], [110, 28], [210, 12], [268, 24]].forEach(([tx, ty]) => {
                g.fillStyle(0x27273a);
                g.fillRect(tx,      ty + 18, 22, midH - ty - 20); // shaft
                g.fillRect(tx - 6,  ty + 10, 34, 20);             // wider head
                g.fillStyle(0x33334a);
                g.fillRect(tx + 9,  ty + 14, 4, 18);              // cross vert
                g.fillRect(tx + 5,  ty + 20, 12, 4);              // cross horiz
            });
            g.generateTexture('bg-mid', 300, midH);
            g.destroy();
        }
        this.bgMid = this.add.tileSprite(sw / 2, sh - midH / 2, sw, midH, 'bg-mid');
        this.bgMid.setScrollFactor(0);
        this.bgMid.setDepth(-100);

        this._parallaxReady = true;
    }

    updateParallax() {
        if (!this._parallaxReady) return;
        const cx = this.cameras.main.scrollX;
        if (this.bgFar) this.bgFar.tilePositionX = cx * 0.15;
        if (this.bgMid) this.bgMid.tilePositionX = cx * 0.4;
    }

    createBasicAnimations() {
        try {
            const existingFrameSet = (keys) => keys.filter((key) => this.textures.exists(key)).map((key) => ({ key }));
            const fallbackTexture = this.textures.exists('skeleton-idle')
                ? 'skeleton-idle'
                : this.textures.exists('skeleton')
                  ? 'skeleton'
                  : null;
            const fallbackFrames = fallbackTexture ? [{ key: fallbackTexture }] : [];

            const ensureAnimation = (key, candidateKeys, frameRate, repeat) => {
                if (this.anims.exists(key)) return;
                const frames = existingFrameSet(candidateKeys);
                const resolvedFrames = frames.length > 0 ? frames : fallbackFrames;
                if (resolvedFrames.length === 0) return;
                this.anims.create({ key, frames: resolvedFrames, frameRate, repeat });
            };

            ensureAnimation(
                'player-idle',
                ['skeleton-idle-0', 'Skeleton-Idle-0', 'Skeleton-Idle-00', 'skeleton-idle'],
                8,
                -1,
            );
            ensureAnimation(
                'player-run',
                ['skeleton-run-0', 'Skeleton-Run-0', 'Skeleton-Run-00', 'skeleton-run', 'skeleton-idle'],
                12,
                -1,
            );
            ensureAnimation(
                'player-attack',
                ['skeleton-attack1-0', 'Skeleton-Attack1-0', 'Skeleton-Attack1-1', 'skeleton-idle'],
                8,
                0,
            );
            ensureAnimation(
                'player-jump',
                ['skeleton-jump-0', 'Skeleton-Jump-0', 'skeleton-idle'],
                1,
                0,
            );
        } catch {
            /* ignore */
        }
    }

    async setupGameObjects() {
        const playerConfig = GameConfig.player || { startPosition: { x: 100, y: 100 } };

        // Use EntityFactory to create player
        this.player = this.entityFactory.createPlayer(playerConfig.startPosition.x, playerConfig.startPosition.y);

        // Start the continuous green aura on the player
        if (this.particleManager && this.player?.sprite) {
            this.particleManager.startPlayerAura(this.player.sprite);
            // Sync aura to starting health (full = 1.0)
            this.particleManager.setAuraHealth(this.gameUI?.health ?? 100, this.gameUI?.maxHealth ?? 100);
        }
    }

    setupCollisions() {
        try {
            if (this.player && this.platforms) {
                this.physicsManager.setupCollision(this.player.sprite, this.platforms);
            }
        } catch {
            /* ignore */
        }
        try {
            if (this.enemyManager) this.enemyManager.setupCollisions(this.player, this.weaponManager);
        } catch {
            /* ignore */
        }
    }

    registerInputHandlers() {
        // Input handling is now managed by Player's InputHandler
    }

    startGame() {
        this.gameState = GameStateUtils.STATES.PLAYING;
    }

    update() {
        try {
            // Global quick-exit: pressing Escape should return the user to the
            // site's home page. Check first so it works from any game state.
            // Global input handling is now done by Player's InputHandler
            if (this.player && this.player.inputHandler) {
                this.player.inputHandler.update();
            }
            // When playing, run the main gameplay update
            if (this.gameState === GameStateUtils.STATES.PLAYING) {
                this.handleGameplayUpdate();
                this.handleRoundLogic();
                return;
            }

            // When paused, allow pause-specific input handling
            if (this.gameState === GameStateUtils.STATES.PAUSED) {
                try {
                    this.handlePausedInput();
                } catch {
                    /* ignore */
                }
                return;
            }

            // When game over, listen for restart/quit input
            if (this.gameState === GameStateUtils.STATES.GAME_OVER) {
                try {
                    this.handleGameOverInput();
                } catch {
                    /* ignore */
                }
                return;
            }
        } catch {
            /* ignore */
        }
    }

    // --- ROUND SYSTEM ---
    startNextRound() {
        if (this.currentRound > this.maxRounds) {
            this.handleVictory();
            return;
        }
        this.roundActive = false;
        this.roundInTransition = true;
        // Example: 3 + round*2 enemies per round
        this.enemiesToSpawn = 3 + this.currentRound * 2;
        this.enemiesSpawnedThisRound = 0;
        if (this.enemyManager) {
            this.enemyManager.clearAllEnemies();
        }
        // Optionally show round UI here
        if (this.gameUI && this.gameUI.showRound) {
            this.gameUI.showRound(this.currentRound);
        }
        // Delay before round starts
        this.time.delayedCall(1500, () => {
            this.roundActive = true;
            this.roundInTransition = false;
        });
    }

    handleRoundLogic() {
        if (!this.roundActive || this.roundInTransition) return;
        // Spawn enemies for this round
        if (this.enemiesSpawnedThisRound < this.enemiesToSpawn) {
            // Only spawn if not exceeding maxEnemies
            if (this.enemyManager && this.enemyManager.getEnemyCount() < GameConfig.enemies.maxEnemies) {
                this.enemyManager.spawnEnemy();
                this.enemiesSpawnedThisRound++;
            }
        } else {
            // All enemies spawned, check if all defeated
            if (this.enemyManager && this.enemyManager.getEnemyCount() === 0) {
                this.currentRound++;
                this.startNextRound();
            }
        }
    }

    handleVictory() {
        this.gameState = GameStateUtils.STATES.GAME_OVER;
        if (this.gameUI && this.gameUI.showVictory) {
            this.gameUI.showVictory();
        } else {
            this.add
                .text(GameConfig.screen.width / 2, GameConfig.screen.height / 2, 'Victory! All rounds complete!', {
                    fontSize: '32px',
                    fill: '#fff',
                    fontFamily: 'Arial',
                })
                .setOrigin(0.5)
                .setScrollFactor(0);
        }
        if (this.enemyManager) this.enemyManager.stopSpawning();
    }

    handleGameplayUpdate() {
        try {
            this.updateParallax();
        } catch {
            /* ignore */
        }
        // Pit-death: player fell below world floor
        try {
            const worldH = GameConfig.world?.height ?? 600;
            if (this.player?.sprite && this.player.sprite.y > worldH + 50) {
                this.gameOver();
                return;
            }
        } catch {
            /* ignore */
        }
        // Pit-death: kill enemies that fell into pits (counts toward round score)
        try {
            const worldH = GameConfig.world?.height ?? 600;
            if (this.enemyManager?.enemies) {
                this.enemyManager.enemies.children.entries
                    .slice() // avoid mutating while iterating
                    .forEach((enemySprite) => {
                        if (enemySprite.y > worldH + 50) {
                            const enemy = enemySprite.enemyRef;
                            if (enemy) {
                                // Deal enough damage to kill regardless of remaining HP
                                const score = enemy.takeDamage(9999);
                                if (score && this.addScore) this.addScore(score);
                                // takeDamage triggers the health component death callback,
                                // but the enemy sprite isn't cleaned up automatically —
                                // explicitly remove it from the scene after the kill.
                                this.enemyManager.removeEnemy(enemy);
                            }
                        }
                    });
            }
        } catch {
            /* ignore */
        }
        try {
            if (this.inputManager) this.inputManager.update();
        } catch {
            /* ignore */
        }
        try {
            if (this.systemManager && this.systemManager.update) this.systemManager.update(16);
        } catch {
            /* ignore */
        }
        try {
            if (this.player) this.player.update();
        } catch {
            /* ignore */
        }
        try {
            if (this.particleManager) this.particleManager.updatePlayerAura();
        } catch {
            /* ignore */
        }
        try {
            if (this.enemyManager && this.enemyManager.update) this.enemyManager.update(this.player);
        } catch {
            /* ignore */
        }
    }

    handleGameOverInput() {
        // Game over input is handled by Player's InputHandler
    }
    handlePausedInput() {
        // Pause input handling simplified
    }

    showLoadingScreen() {
        try {
            this.add
                .text(GameConfig.screen.width / 2, GameConfig.screen.height / 2, 'Loading Noteleks Heroes...', {
                    fontSize: '24px',
                    fill: '#4ade80',
                    fontFamily: 'Arial',
                })
                .setOrigin(0.5);
        } catch {
            /* ignore */
        }
    }

    addScore(points) {
        try {
            if (this.gameUI) this.gameUI.addScore(points);
        } catch {
            /* ignore */
        }
    }

    pauseGame() {
        if (this.gameState === GameStateUtils.STATES.PLAYING) {
            this.gameState = GameStateUtils.STATES.PAUSED;
            try {
                if (this.physics) this.physics.pause();
            } catch {
                /* ignore */
            }
            try {
                if (this.systemManager) this.systemManager.pause();
            } catch {
                /* ignore */
            }
            try {
                if (this.gameUI) this.gameUI.showPauseScreen();
            } catch {
                /* ignore */
            }
        }
    }
    resumeGame() {
        if (this.gameState === GameStateUtils.STATES.PAUSED) {
            this.gameState = GameStateUtils.STATES.PLAYING;
            try {
                if (this.physics) this.physics.resume();
            } catch {
                /* ignore */
            }
            try {
                if (this.systemManager) this.systemManager.resume();
            } catch {
                /* ignore */
            }
            try {
                if (this.gameUI) this.gameUI.hidePauseScreen();
            } catch {
                /* ignore */
            }
        }
    }
    gameOver() {
        this.gameState = GameStateUtils.STATES.GAME_OVER;
        // Reset round state
        this.currentRound = 1;
        this.enemiesToSpawn = 0;
        this.enemiesSpawnedThisRound = 0;
        this.roundActive = false;
        this.roundInTransition = false;
        try {
            if (this.physics) this.physics.pause();
        } catch {
            /* ignore */
        }
        try {
            if (this.gameUI) this.gameUI.showGameOver();
        } catch {
            /* ignore */
        }
        try {
            if (this.enemyManager) this.enemyManager.stopSpawning();
        } catch {
            /* ignore */
        }
        try {
            if (this.particleManager) this.particleManager.stopPlayerAura();
        } catch {
            /* ignore */
        }
    }
    restartGame() {
        this.gameState = GameStateUtils.STATES.PLAYING;
        // Reset round state
        this.currentRound = 1;
        this.enemiesToSpawn = 0;
        this.enemiesSpawnedThisRound = 0;
        this.roundActive = false;
        this.roundInTransition = false;
        try {
            if (this.enemyManager) this.enemyManager.reset();
        } catch {
            /* ignore */
        }
        try {
            if (this.weaponManager && this.weaponManager.getWeaponsGroup) this.weaponManager.getWeaponsGroup().clear(true, true);
        } catch {
            /* ignore */
        }
        try {
            if (this.gameUI) this.gameUI.reset();
        } catch {
            /* ignore */
        }
        try {
            const playerConfig = GameConfig.player || { startPosition: { x: 100, y: 100 } };
            if (this.player && this.player.reset) this.player.reset(playerConfig.startPosition.x, playerConfig.startPosition.y);
        } catch {
            /* ignore */
        }
        try {
            if (this.physics) this.physics.resume();
        } catch {
            /* ignore */
        }
        try {
            if (this.particleManager && this.player?.sprite) {
                this.particleManager.startPlayerAura(this.player.sprite);
                this.particleManager.setAuraHealth(this.gameUI?.health ?? 100, this.gameUI?.maxHealth ?? 100);
            }
        } catch {
            /* ignore */
        }
        // Start first round again
        this.startNextRound();
    }
    shutdown() {
        try {
            if (this.enemyManager) this.enemyManager.shutdown();
        } catch {
            /* ignore */
        }
        try {
            if (this.inputManager) this.inputManager.destroy();
        } catch {
            /* ignore */
        }
        try {
            if (this.platformManager) this.platformManager.shutdown();
        } catch {
            /* ignore */
        }
        try {
            this.physicsManager = null;
        } catch {
            /* ignore */
        }
        try {
            if (this.systemManager) this.systemManager.shutdown();
        } catch {
            /* ignore */
        }
    }
}

export default GameScene;
