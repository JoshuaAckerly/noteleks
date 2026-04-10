/* global Phaser */
import GameConfig from './config/GameConfig.js';
import GameScene from './scenes/GameScene.js';
import LoadingScene from './scenes/LoadingScene.js';

// Spine plugin is imported dynamically inside initialize() to keep the main
// bundle smaller and allow code-splitting. Do not import it at top-level.

/**
 * Noteleks Game - Main Game Class
 * Refactored for modularity and maintainability
 */
class NoteleksGame {
    constructor() {
        this.game = null;
        // Install global error handlers early so mobile-only failures can be captured
        // into localStorage for post-mortem inspection. See _installGlobalErrorHandlers().
        this._installGlobalErrorHandlers();

        // Lightweight low-end device detection: use conservative heuristics to
        // decide whether to enable a lowQuality fallback mode that avoids heavy
        // assets (Spine) and reduces resolution. This helps small/old phones.
        try {
            const deviceMemory = navigator && navigator.deviceMemory ? Number(navigator.deviceMemory) : null;
            const cores = navigator && navigator.hardwareConcurrency ? Number(navigator.hardwareConcurrency) : null;
            const ua = (navigator && navigator.userAgent) || '';
            // Heuristics: memory < 2GB or 1-2 cores => lowQuality
            const lowMem = deviceMemory !== null ? deviceMemory < 2 : false;
            const lowCores = cores !== null ? cores <= 2 : false;
            const smallScreenUA = /iPhone|Android/i.test(ua) && window.innerWidth <= 420;
            this._detectedDeviceInfo = { deviceMemory, cores, ua };
            // Expose a global flag for debug/QA toggles
            window.noteleks_lowQuality = lowMem || lowCores || smallScreenUA ? true : false;
            GameConfig.lowQuality = !!window.noteleks_lowQuality;
        } catch {
            // ignore detection errors
            GameConfig.lowQuality = false;
        }

        this.config = this.createGameConfig();
    }

    _installGlobalErrorHandlers() {
        try {
            // Keep the original handlers if set so we don't clobber other code.
            const originalOnError = window.onerror;
            window.onerror = (message, source, lineno, colno, error) => {
                try {
                    const payload = {
                        type: 'error',
                        message: (message && (message.stack || message)) || (error && error.message) || String(message),
                        stack: (error && (error.stack || null)) || null,
                        source,
                        lineno,
                        colno,
                        userAgent: navigator.userAgent,
                        deviceMemory: navigator.deviceMemory || null,
                        cores: navigator.hardwareConcurrency || null,
                        ts: Date.now(),
                    };
                    try {
                        localStorage.setItem('noteleks_last_error', JSON.stringify(payload));
                    } catch {
                        /* ignore localStorage errors */
                    }
                    // Try sendBeacon as a best-effort remote capture (server endpoint optional)
                    try {
                        if (navigator && typeof navigator.sendBeacon === 'function') {
                            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                            navigator.sendBeacon('/__noteleks_error', blob);
                        }
                    } catch {
                        /* ignore sendBeacon errors */
                    }
                } catch {
                    // ignore storage/set errors
                }
                if (typeof originalOnError === 'function') {
                    try {
                        originalOnError(message, source, lineno, colno, error);
                    } catch {
                        /* ignore originalOnError errors */
                    }
                }
                // Do not suppress the default handler return value (let it run normally)
                return false;
            };

            window.addEventListener('unhandledrejection', (ev) => {
                try {
                    const reason = ev && ev.reason;
                    const payload = {
                        type: 'unhandledrejection',
                        message: (reason && (reason.message || String(reason))) || 'unhandledrejection',
                        stack: (reason && (reason.stack || null)) || null,
                        userAgent: navigator.userAgent,
                        deviceMemory: navigator.deviceMemory || null,
                        cores: navigator.hardwareConcurrency || null,
                        ts: Date.now(),
                    };
                    try {
                        localStorage.setItem('noteleks_last_error', JSON.stringify(payload));
                    } catch {
                        /* ignore localStorage errors */
                    }
                    try {
                        if (navigator && typeof navigator.sendBeacon === 'function') {
                            const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
                            navigator.sendBeacon('/__noteleks_error', blob);
                        }
                    } catch {
                        /* ignore sendBeacon errors */
                    }
                } catch {
                    // ignore
                }
            });
        } catch {
            // ignore any errors while installing handlers (best-effort)
        }
    }

    createGameConfig() {
        // Verify Phaser is available before creating config
        if (typeof Phaser === 'undefined') {
            throw new Error('Phaser is not loaded. Make sure phaser.min.js loads before the game module.');
        }

        const config = {
            type: Phaser.AUTO,
            width: GameConfig.screen.width,
            height: GameConfig.screen.height,
            backgroundColor: GameConfig.screen.backgroundColor,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: GameConfig.physics.gravity,
                    debug: GameConfig.physics.debug,
                },
            },
            // Start with a LoadingScene so all assets (manifest, sprites, spine)
            // are loaded before we start the main GameScene.
            scene: [LoadingScene, GameScene],
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH,
                min: {
                    width: 400,
                    height: 300,
                },
                max: {
                    width: 1600,
                    height: 1200,
                },
            },
        };

        const spinePlugin = typeof window !== 'undefined' ? window.spine?.SpinePlugin : null;
        if (GameConfig.useSpine && spinePlugin) {
            config.plugins = {
                scene: [
                    {
                        key: 'spine',
                        plugin: spinePlugin,
                        mapping: 'spine',
                    },
                ],
            };
        }

        return config;
    }

    async initialize(containerId = 'phaser-game') {
        // Verify Phaser is available
        if (typeof Phaser === 'undefined') {
            const msg = 'Phaser is not available. Cannot initialize game.';
            console.error('[NoteleksGame]', msg);
            throw new Error(msg);
        }

        // Check if container exists
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('[NoteleksGame] initialize aborted: container not found:', containerId);
            return false;
        }

        // Build the game config
        const finalConfig = this.createGameConfig();

        // If lowQuality mode is enabled, reduce resolution and disable heavy features
        if (GameConfig.lowQuality) {
            try {
                // Reduce the target width/height to lower memory use and texture sizes
                finalConfig.width = Math.max(320, Math.floor((finalConfig.width || GameConfig.screen.width) / 1.5));
                finalConfig.height = Math.max(240, Math.floor((finalConfig.height || GameConfig.screen.height) / 1.5));
                // Prefer a lower resolution canvas scale to reduce GPU memory
                finalConfig.render = finalConfig.render || {};
                finalConfig.render.pixelArt = true;
                finalConfig.resolution = 1; // keep device resolution low
                // Ensure we do not attempt to register the Spine plugin
                finalConfig.plugins = undefined;
            } catch {
                // ignore adjustments
            }
        }
        this.game = new Phaser.Game({
            ...finalConfig,
            parent: containerId,
        });
        // Phaser will auto-add the scene(s) declared in config.scene and start them.

        // Add game event listeners
        this.setupEventListeners();

        return true;
    }

    _showStoredErrorIfAny(_container) {
        // Debug banner removed - errors are still logged to localStorage for debugging
        return;
    }

    setupEventListeners() {
        // Game ready event
        this.game.events.once('ready', () => {
            // Game is ready
        });

        // Handle browser visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });

        // Handle window focus
        window.addEventListener('blur', () => this.pause());
        window.addEventListener('focus', () => this.resume());
    }

    pause() {
        if (this.game && this.game.scene) {
            const scene = this.game.scene.getScene('GameScene');
            if (scene && scene.gameState === 'playing') {
                scene.pauseGame();
            }
        }
    }

    resume() {
        if (this.game && this.game.scene) {
            const scene = this.game.scene.getScene('GameScene');
            if (scene && scene.gameState === 'paused') {
                scene.resumeGame();
            }
        }
    }

    destroy() {
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
        }
    }

    // Utility methods for external integration
    getGame() {
        return this.game;
    }

    getScene(key = 'GameScene') {
        return this.game ? this.game.scene.getScene(key) : null;
    }

    isRunning() {
        return this.game && this.game.isRunning;
    }

    getConfig() {
        return this.config;
    }

    // Static factory method
    // Static factory method
    static async create(containerId) {
        const game = new NoteleksGame();
        try {
            const success = await game.initialize(containerId);
            return success ? game : null;
        } catch {
            return null;
        }
    }
}

export default NoteleksGame;
