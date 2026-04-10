/* global Phaser */
import DebugUtils from './utils/DebugUtils.js';
/**
 * GameUI class manages all user interface elements
 */
class GameUI {
    constructor(scene) {
        this.scene = scene;
        this.score = 0;
        this.health = 100;
        this.maxHealth = 100;

        // Internal flags: whether we fell back to DOM-based UI to avoid canvas->texture work
        this._usingDOMUI = false;
        this._textCache = Object.create(null);

        this.roundText = null;
        this.roundTransitionText = null;

        this.initializeUI();
    }

    initializeUI() {
        // Try to create in-canvas UI. If any canvas-backed text creation fails
        // (WebGL/createTexture edge-case), fall back to DOM-based UI and avoid
        // further canvas texture work.
        try {
            // Round display (bottom right)
            const sw = this.scene.scale.width;
            const sh = this.scene.scale.height;
            this.roundText = this.scene.add.text(sw - 12, sh - 12, 'Round: 1', {
                fontSize: '14px',
                fill: '#ffd700',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 2,
            });
            this.roundText.setOrigin(1, 1);
            this.roundText.setScrollFactor(0);
            this.roundText.setDepth(1000);

            // Weapon indicator
            this.weaponText = this.scene.add.text(16, 100, '', {
                fontSize: '18px',
                fill: '#ffffff',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 2,
            });
            this.weaponText.setScrollFactor(0);
            this.weaponText.setDepth(1000);

            // Game over screen (initially hidden) - positioned at center of screen
            const centerX = this.scene.scale.width / 2;
            const centerY = this.scene.scale.height / 2;
            this.gameOverContainer = this.scene.add.container(centerX, centerY);
            // Ensure Game Over UI is on top of all other UI and game objects
            // UI elements use depth ~1000; set the container higher so it always renders above.
            this.gameOverContainer.setDepth(2000);
            this.gameOverContainer.setScrollFactor(0);
            this.gameOverContainer.setVisible(false);

            this.createGameOverScreen();

            // Update DOM elements as well
            this.updateDOMElements();

            // Create mobile UI elements if needed
            this.createMobileUIElements();
        } catch {
            // If any canvas/text/texture creation fails, fall back to DOM-only UI.
            // This will avoid repeated WebGL createTexture / bindTexture errors
            // in environments where the GL context is in a transient/bad state.
            this._usingDOMUI = true;
            this._createDOMUI();
        }
    }

    // Show round transition (e.g., "Round 2") for a short time
    showRound(roundNum) {
        if (!this.roundTransitionText) {
            const centerX = this.scene.scale.width / 2;
            const centerY = 80;
            this.roundTransitionText = this.scene.add.text(centerX, centerY, '', {
                fontSize: '48px',
                fill: '#ffd700',
                fontFamily: 'Arial Black',
                stroke: '#000000',
                strokeThickness: 6,
            });
            this.roundTransitionText.setOrigin(0.5, 0);
            this.roundTransitionText.setScrollFactor(0);
            this.roundTransitionText.setDepth(2000);
        }
        this.roundTransitionText.setText(`Round ${roundNum}`);
        this.roundTransitionText.setVisible(true);
        this.scene.tweens.add({
            targets: this.roundTransitionText,
            alpha: { from: 1, to: 0 },
            duration: 1200,
            onComplete: () => {
                this.roundTransitionText.setVisible(false);
                this.roundTransitionText.setAlpha(1);
            },
        });

        this.updateRound(roundNum);
    }

    // Update the persistent round display
    updateRound(roundNum) {
        if (this.roundText) {
            this.roundText.setText(`Round: ${roundNum}`);
        }
    }

    createMobileUIElements() {
        // Check if we're on mobile
        const isMobile = this.detectMobile();

        if (isMobile) {
            // If we're using the DOM fallback, create mobile UI elements in DOM instead
            if (this._usingDOMUI) {
                // create a simple DOM pause button if needed
                try {
                    if (!this._domMobilePauseEl) {
                        const btn = document.createElement('button');
                        btn.id = 'noteleks-mobile-pause';
                        btn.textContent = 'Pause';
                        btn.style.position = 'fixed';
                        btn.style.right = '12px';
                        btn.style.top = '12px';
                        btn.style.zIndex = 99999;
                        document.body.appendChild(btn);
                        btn.addEventListener('click', () => {
                            if (this.scene.gameState === 'playing') this.scene.pauseGame();
                            else if (this.scene.gameState === 'paused') this.scene.resumeGame();
                        });
                        this._domMobilePauseEl = btn;
                    }
                } catch {
                    // ignore DOM fallback errors
                }
                return;
            }
            // Create pause button for mobile
            this.mobilePauseButton = this.scene.add.graphics();
            this.mobilePauseButton.fillStyle(0x333333, 0.8);
            this.mobilePauseButton.fillRoundedRect(this.scene.scale.width - 60, 10, 50, 30, 5);
            this.mobilePauseButton.lineStyle(2, 0xffffff, 1);
            this.mobilePauseButton.strokeRoundedRect(this.scene.scale.width - 60, 10, 50, 30, 5);
            this.mobilePauseButton.setScrollFactor(0);
            this.mobilePauseButton.setDepth(1000);
            this.mobilePauseButton.setInteractive(new Phaser.Geom.Rectangle(this.scene.scale.width - 60, 10, 50, 30), Phaser.Geom.Rectangle.Contains);

            // Pause button text
            this.mobilePauseText = this.scene.add.text(this.scene.scale.width - 35, 25, '⏸', {
                fontSize: '16px',
                fill: '#ffffff',
                fontFamily: 'Arial',
            });
            this.mobilePauseText.setOrigin(0.5);
            this.mobilePauseText.setScrollFactor(0);
            this.mobilePauseText.setDepth(1001);

            // Handle pause button tap
            this.mobilePauseButton.on('pointerdown', () => {
                if (this.scene.gameState === 'playing') {
                    this.scene.pauseGame();
                } else if (this.scene.gameState === 'paused') {
                    this.scene.resumeGame();
                }
            });
        }
    }

    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return (
            /android|avantgo|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
                userAgent,
            ) ||
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0
        );
    }

    createGameOverScreen() {
        // Most game over UI is canvas-backed. Guard it so we can fall back to DOM
        // if canvas text creation fails for any reason.
        try {
            // Responsive sizing based on screen width
            const isMobile = this.detectMobile();
            const bgWidth = isMobile ? Math.min(this.scene.scale.width * 0.9, 400) : 600;
            const bgHeight = isMobile ? Math.min(this.scene.scale.height * 0.6, 300) : 400;

            // Background
            const gameOverBg = this.scene.add.graphics();
            gameOverBg.fillStyle(0x000000, 0.8);
            gameOverBg.fillRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight);
            this.gameOverContainer.add(gameOverBg);

            // Game Over text
            const gameOverText = this.scene.add.text(0, -100, 'GAME OVER', {
                fontSize: '48px',
                fill: '#ff0000',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 3,
            });
            gameOverText.setOrigin(0.5);
            this.gameOverContainer.add(gameOverText);

            // Instructions
            const instructionText = isMobile ? 'Tap to restart or use browser back to quit' : 'Press R to restart or ESC to quit';

            const instructionsText = this.scene.add.text(0, 30, instructionText, {
                fontSize: '18px',
                fill: '#4ade80',
                fontFamily: 'Arial',
                stroke: '#000000',
                strokeThickness: 2,
                align: 'center',
            });
            instructionsText.setOrigin(0.5);
            this.gameOverContainer.add(instructionsText);

            // Add mobile restart button
            if (isMobile) {
                const restartButton = this.scene.add.graphics();
                restartButton.fillStyle(0x4ade80, 0.8);
                restartButton.fillRoundedRect(-80, 60, 160, 40, 10);
                restartButton.lineStyle(2, 0xffffff, 1);
                restartButton.strokeRoundedRect(-80, 60, 160, 40, 10);
                this.gameOverContainer.add(restartButton);

                const restartText = this.scene.add.text(0, 80, 'RESTART', {
                    fontSize: '18px',
                    fill: '#ffffff',
                    fontFamily: 'Arial Bold',
                    align: 'center',
                });
                restartText.setOrigin(0.5);
                this.gameOverContainer.add(restartText);

                // Make button interactive
                restartButton.setInteractive(new Phaser.Geom.Rectangle(-80, 60, 160, 40), Phaser.Geom.Rectangle.Contains);
                restartButton.on('pointerdown', () => {
                    this.scene.restartGame();
                });
            }
        } catch {
            // Canvas-backed game over UI failed; create a DOM-based fallback
            // so the game still presents the end state without causing GL errors.
            this._usingDOMUI = true;
            this._createDOMUI(true);
        }
    }

    // Create a minimal DOM-based UI fallback when canvas-backed UI cannot be used.
    _createDOMUI(isGameOver = false) {
        try {
            // Optionally show game over overlay
            if (isGameOver) {
                if (!this._domGameOverEl) {
                    const go = document.createElement('div');
                    go.id = 'noteleks-gameover';
                    go.style.position = 'fixed';
                    go.style.left = '50%';
                    go.style.top = '50%';
                    go.style.transform = 'translate(-50%, -50%)';
                    go.style.zIndex = 99999;
                    go.style.textAlign = 'center';
                    go.style.padding = '16px 24px';
                    go.style.background = 'rgba(0,0,0,0.85)';
                    go.style.color = '#fff';
                    go.style.fontFamily = 'Arial, sans-serif';
                    go.style.display = 'none';
                    go.innerHTML = `<div style="font-size:32px;color:#ff6666;font-weight:bold;margin-bottom:8px;">GAME OVER</div>`;
                    document.body.appendChild(go);
                    this._domGameOverEl = go;
                }
            }
        } catch {
            // best-effort DOM fallback; ignore failures
        }
    }

    updateScore(newScore) {
        this.score = newScore;
        this.updateDOMElements();
    }

    addScore(points) {
        this.score += points;
        this.updateScore(this.score);
    }

    updateHealth(newHealth) {
        this.health = Math.max(0, Math.min(this.maxHealth, newHealth));
        this.updateDOMElements();
        // Sync aura intensity with current health
        if (this.scene.particleManager) {
            this.scene.particleManager.setAuraHealth(this.health, this.maxHealth);
        }
    }

    takeDamage(damage) {
        this.updateHealth(this.health - damage);
        return this.health <= 0;
    }

    updateWeapon(weaponType) {
        this.weaponText.setText(`Weapon: ${weaponType.charAt(0).toUpperCase() + weaponType.slice(1)}`);
    }

    showGameOver() {
        // Update position to stay centered in current viewport
        this.updateGameOverPosition();

        this.gameOverContainer.setVisible(true);

        // Animate game over screen
        this.gameOverContainer.setScale(0);
        this.scene.tweens.add({
            targets: this.gameOverContainer,
            scaleX: 1,
            scaleY: 1,
            duration: 500,
            ease: 'Bounce.easeOut',
        });
    }

    hideGameOver() {
        this.gameOverContainer.setVisible(false);
    }

    showPauseScreen() {
        // Simple pause indicator
        if (!this.pauseText && !this._pauseDOMOverlayCreated) {
            const isMobile = this.detectMobile();
            const pauseMessage = isMobile ? 'PAUSED\nTap pause button to resume' : 'PAUSED\nPress P to resume';

            // Defensive: ensure renderer and GL context exist before creating canvas-backed text,
            // which triggers createTexture / canvasToTexture calls that can fail in edge cases.
            const renderer = this.scene && this.scene.sys && this.scene.sys.game && this.scene.sys.game.renderer;
            try {
                if (renderer && renderer.gl) {
                    this.pauseText = this.scene.add.text(400, 300, pauseMessage, {
                        fontSize: '36px',
                        fill: '#ffffff',
                        fontFamily: 'Arial',
                        align: 'center',
                        stroke: '#000000',
                        strokeThickness: 3,
                    });
                    this.pauseText.setOrigin(0.5);
                    this.pauseText.setScrollFactor(0);
                } else {
                    // Renderer or gl not available: create a lightweight DOM fallback overlay instead
                    this._createPauseDOMOverlay(pauseMessage);
                }
            } catch {
                // Swallow texture creation errors and fall back to DOM overlay.
                // This prevents WebGL createTexture exceptions from bubbling into the app logs.
                // Preserve a console warning to aid future debugging.
                this._createPauseDOMOverlay(pauseMessage);
            }
        }

        if (this.pauseText) {
            this.pauseText.setVisible(true);
        } else if (this._pauseDOMOverlayCreated) {
            this._showPauseDOMOverlay();
        }

        // Hide touch controls when paused
        if (this.scene.inputManager && this.scene.inputManager.isMobileDevice()) {
            this.scene.inputManager.showTouchControls(false);
        }
    }

    hidePauseScreen() {
        if (this.pauseText) {
            this.pauseText.setVisible(false);
        }

        if (this._pauseDOMOverlayCreated) {
            this._hidePauseDOMOverlay();
        }

        // Show touch controls when unpaused
        if (this.scene.inputManager && this.scene.inputManager.isMobileDevice()) {
            this.scene.inputManager.showTouchControls(true);
        }
    }

    updateDOMElements() {
        // Only perform DOM sync when explicitly enabled in config (keeps UI in-canvas by default)
        try {
            if (!DebugUtils.shouldSyncDOM()) return;
        } catch {
            /* ignore */
            return;
        }

        // Update DOM elements if they exist
        const scoreElement = document.getElementById('score-value');
        if (scoreElement) scoreElement.textContent = this.score;
    }

    reset() {
        this.score = 0;
        this.health = this.maxHealth;
        this.updateHealth(this.maxHealth);
        this.hideGameOver();
        this.hidePauseScreen();
    }

    // Update game over position to stay centered
    updateGameOverPosition() {
        if (this.gameOverContainer) {
            const centerX = this.scene.scale.width / 2;
            const centerY = this.scene.scale.height / 2;
            this.gameOverContainer.setPosition(centerX, centerY);
        }
    }

    // Lightweight DOM overlay fallback for pause indicator (used when renderer.gl isn't available)
    _createPauseDOMOverlay(message) {
        try {
            const root = document.body || document.documentElement;
            const overlay = document.createElement('div');
            overlay.id = 'noteleks-pause-overlay';
            overlay.style.position = 'fixed';
            overlay.style.left = '50%';
            overlay.style.top = '50%';
            overlay.style.transform = 'translate(-50%, -50%)';
            overlay.style.zIndex = 99999;
            overlay.style.pointerEvents = 'none';
            overlay.style.textAlign = 'center';
            overlay.style.whiteSpace = 'pre-line';
            overlay.style.fontFamily = 'Arial, sans-serif';
            overlay.style.fontSize = '32px';
            overlay.style.color = '#ffffff';
            overlay.style.textShadow = '0 0 4px rgba(0,0,0,0.85)';
            overlay.style.background = 'rgba(0,0,0,0.35)';
            overlay.style.padding = '12px 20px';
            overlay.style.borderRadius = '8px';
            overlay.style.display = 'none';
            overlay.textContent = message;
            root.appendChild(overlay);
            this._pauseDOMOverlayCreated = true;
            this._pauseDOMOverlayEl = overlay;
        } catch {
            // If DOM overlay creation fails, don't block the game  just mark as not created.
            this._pauseDOMOverlayCreated = false;
            this._pauseDOMOverlayEl = null;
        }
    }

    _showPauseDOMOverlay() {
        if (this._pauseDOMOverlayEl) this._pauseDOMOverlayEl.style.display = 'block';
    }

    _hidePauseDOMOverlay() {
        if (this._pauseDOMOverlayEl) this._pauseDOMOverlayEl.style.display = 'none';
    }

    getScore() {
        return this.score;
    }

    getHealth() {
        return this.health;
    }
}

export default GameUI;
