/**
 * Noteleks Game - Clean Entry Point
 * Simplified main entry point without extensive logging and debug systems
 */
import GameConfig from './config/GameConfig.js';

/**
 * Initialize the game but wait for Phaser and Spine to be available
 */
async function bootstrap() {
    try {
        const mod = await import('./NoteleksGameModular.js');
        const NoteleksGame = mod && mod.default ? mod.default : mod;
        const game = await NoteleksGame.create('phaser-game');

        if (game && typeof window !== 'undefined') {
            window.noteleksGame = game;
        }

        return game;
    } catch (e) {
        console.error('[Noteleks] Failed to initialize game:', e.message);
        throw e;
    }
}

async function ensureSpinePlugin() {
    if (!GameConfig.useSpine || window.noteleks_lowQuality) {
        return true;
    }

    if (window.spine?.SpinePlugin) {
        return true;
    }

    try {
        const spineModule = await import('@esotericsoftware/spine-phaser');
        const SpinePlugin = spineModule?.SpinePlugin;
        if (SpinePlugin) {
            window.spine = { ...(window.spine || {}), SpinePlugin };
        }
        return !!window.spine?.SpinePlugin;
    } catch (e) {
        console.warn('[Noteleks] Failed to load Spine plugin, falling back to frame animations:', e.message);
        GameConfig.useSpine = false;
        return false;
    }
}

if (typeof window !== 'undefined') {
    // Only auto-bootstrap when the game container is present
    const hasGameContainer = !!document.getElementById('phaser-game');

    if (hasGameContainer) {
        const startGame = async () => {
            // Wait for Phaser and Spine to be available
            const maxWait = 10000; // 10 seconds for slow mobile connections
            const interval = 50; // Check more frequently
            let waited = 0;

            const checkReady = () => {
                return new Promise((resolve, reject) => {
                    const timer = setInterval(() => {
                        if (window.Phaser) {
                            clearInterval(timer);
                            console.log('[Noteleks] Phaser detected after ' + waited + 'ms, starting game');
                            resolve(true);
                            return;
                        }

                        waited += interval;
                        if (waited >= maxWait) {
                            clearInterval(timer);
                            const msg = '[Noteleks] Phaser not detected after ' + maxWait + 'ms. Check network connection.';
                            console.error(msg);
                            reject(new Error(msg));
                        }
                    }, interval);
                });
            };

            try {
                await checkReady();
                await ensureSpinePlugin();
                await bootstrap();
            } catch (e) {
                console.error('[Noteleks] Bootstrap failed:', e.message);
                // Display error to user on mobile
                const container = document.getElementById('phaser-game');
                if (container) {
                    container.innerHTML =
                        '<div style="color: white; padding: 20px; text-align: center; font-family: Arial;">' +
                        '<h2>Failed to load game</h2>' +
                        '<p>' +
                        e.message +
                        '</p>' +
                        '<p>Please check your internet connection and refresh the page.</p>' +
                        '</div>';
                }
            }
        };

        // Wait for DOM to be ready before checking for Phaser
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startGame, { once: true });
        } else {
            // DOM already loaded, wait a bit for scripts to load
            setTimeout(startGame, 100);
        }
    } else {
        console.log('[Noteleks] Game container not found, skipping auto-start');
    }
}

export default null;
