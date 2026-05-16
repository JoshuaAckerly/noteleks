import GameConfig from '../config/GameConfig.js';
import PhysicsManager from './PhysicsManager.js';

/**
 * InputHandler - Manages keyboard input for the player
 * Extracted from Player class for better separation of concerns
 */
class InputHandler {
    constructor(scene) {
        this.scene = scene;
        this.keys = null;
        this.lastAttackTime = 0;
        this.attackCooldown = 300; // milliseconds - matches animation duration
        this.physicsManager = new PhysicsManager(scene);
        this.lastJumpKeyState = false; // Track jump key state for edge detection

        // Coyote time: allow jumping briefly after walking off a ledge
        this._lastGroundedTime = 0;
        this._coyoteTime = GameConfig.player.coyoteTime ?? 100;

        // Jump buffer: register a jump press slightly before landing
        this._jumpBufferTime = 0;
        this._jumpBuffer = GameConfig.player.jumpBuffer ?? 120;

        // Spear charge state
        this.isCharging = false;
        this.chargeStartTime = 0;
        this.maxChargeTime = 1000; // ms to reach full charge
        this._chargeGraphic = null;
        this._prevSpaceDown = false;

        this.setupKeys();
    }

    setupKeys() {
        // Create keyboard keys once
        this.keys = this.scene.input.keyboard.addKeys('W,S,A,D,UP,DOWN,LEFT,RIGHT,SPACE,R,ESC');
    }

    /**
     * Get current input state
     * @returns {Object} Input state object
     */
    getInputState() {
        if (!this.keys) return null;

        // Get keyboard input
        const keyboardState = {
            left: this.keys.LEFT.isDown || this.keys.A.isDown,
            right: this.keys.RIGHT.isDown || this.keys.D.isDown,
            up: this.keys.UP.isDown || this.keys.W.isDown,
            down: this.keys.DOWN.isDown || this.keys.S.isDown,
            attack: this.keys.SPACE.isDown && this.canAttack(),
            // Raw key states for other uses
            raw: {
                left: this.keys.LEFT.isDown,
                right: this.keys.RIGHT.isDown,
                up: this.keys.UP.isDown,
                down: this.keys.DOWN.isDown,
                a: this.keys.A.isDown,
                d: this.keys.D.isDown,
                w: this.keys.W.isDown,
                s: this.keys.S.isDown,
                space: this.keys.SPACE.isDown,
            },
        };

        // Always merge touch input when an inputManager with getTouchState() is present.
        // This covers phones, tablets, and any touch-capable device irrespective of
        // how isMobileDevice() categorised the UA string.
        if (this.scene.inputManager && typeof this.scene.inputManager.getTouchState === 'function') {
            const touchState = this.scene.inputManager.getTouchState();
            // Only layer in touch values that are active so keyboard always wins
            return {
                left: keyboardState.left || touchState.left,
                right: keyboardState.right || touchState.right,
                up: keyboardState.up || touchState.jump,
                down: keyboardState.down || touchState.down,
                attack: (keyboardState.attack || touchState.attack) && this.canAttack(),
                raw: keyboardState.raw,
            };
        }

        return keyboardState;
    }

    /**
     * Check if attack is available (cooldown check)
     */
    canAttack() {
        const currentTime = Date.now();
        return currentTime - this.lastAttackTime > this.attackCooldown;
    }

    /**
     * Register that an attack was performed
     */
    registerAttack() {
        this.lastAttackTime = Date.now();
    }

    /**
     * Process input for player movement and actions
     * @param {Object} player - Player instance
     * @param {Object} inputState - Current input state
     */
    processPlayerInput(player, inputState) {
        if (!player || !player.sprite || !player.sprite.body) return;
        if (this.scene.gameState !== 'playing') return;

        // Reset horizontal velocity
        this.physicsManager.setVelocityX(player.sprite, 0);

        // Check if player is on ground
        const isOnGround = this.physicsManager.isTouchingDown(player.sprite);

        const speed = GameConfig.player.speed;
        const now = Date.now();

        // Track coyote time — record last frame we were on the ground
        if (isOnGround) {
            this._lastGroundedTime = now;
        }
        const withinCoyoteWindow = (now - this._lastGroundedTime) <= this._coyoteTime;

        // Handle horizontal movement
        if (inputState.left) {
            this.physicsManager.setVelocityX(player.sprite, -speed);
            player.sprite.setFlipX(true);
            if (isOnGround) {
                player.playAnimation('run');
            }
        } else if (inputState.right) {
            this.physicsManager.setVelocityX(player.sprite, speed);
            player.sprite.setFlipX(false);
            if (isOnGround) {
                player.playAnimation('run');
            }
        } else if (isOnGround) {
            player.playAnimation('idle');
        }

        // Handle jump with double jump, coyote time, and jump buffering
        const jumpKeyPressed = inputState.up;
        const jumpKeyJustPressed = jumpKeyPressed && !this.lastJumpKeyState;
        this.lastJumpKeyState = jumpKeyPressed;

        // Record when jump was pressed for buffering
        if (jumpKeyJustPressed) {
            this._jumpBufferTime = now;
        }

        const jumpBuffered = (now - this._jumpBufferTime) <= this._jumpBuffer;

        if (jumpBuffered && (isOnGround || withinCoyoteWindow)) {
            // Ground / coyote jump — reset jumps so we always use full jump power
            const movementComponent = player.getComponent('movement');
            if (movementComponent) {
                movementComponent.resetJumps();
                if (movementComponent.jump()) {
                    this._jumpBufferTime = 0; // consume the buffer
                    player.playAnimation('jump', false);
                }
            }
        } else if (jumpKeyJustPressed) {
            // Air jump (double jump when not on ground / coyote window expired)
            const movementComponent = player.getComponent('movement');
            if (movementComponent && movementComponent.jump()) {
                this._jumpBufferTime = 0;
                player.playAnimation('jump', false);
            }
        }

        // Play jump animation while in air
        if (!isOnGround) {
            player.playAnimation('jump', false);
        }

        // ── Spear charge mechanic ────────────────────────────────────────────
        // Spacebar DOWN → begin charging
        // Spacebar HELD → animate charge indicator above player
        // Spacebar UP   → release throw with charge multiplier
        const spaceDown = this.keys?.SPACE?.isDown ?? false;
        const spaceJustDown = spaceDown && !this._prevSpaceDown;
        const spaceJustUp   = !spaceDown && this._prevSpaceDown;
        this._prevSpaceDown = spaceDown;

        // Start charging
        if (spaceJustDown && this.canAttack()) {
            this.isCharging = true;
            this.chargeStartTime = Date.now();
            if (!this._chargeGraphic) {
                this._chargeGraphic = this.scene.add.graphics();
                this._chargeGraphic.setDepth(100);
            }
        }

        // Update charge bar
        if (this.isCharging && this._chargeGraphic) {
            const chargePercent = Math.min((Date.now() - this.chargeStartTime) / this.maxChargeTime, 1);
            const barW = 40;
            const barH = 6;
            const barX = player.sprite.x - barW / 2;
            const barY = player.sprite.y - 85;
            this._chargeGraphic.clear();
            this._chargeGraphic.fillStyle(0x333333, 0.8);
            this._chargeGraphic.fillRect(barX, barY, barW, barH);
            const fillColor = chargePercent < 0.5 ? 0x9b6dff : 0xffd700;
            this._chargeGraphic.fillStyle(fillColor, 1);
            this._chargeGraphic.fillRect(barX, barY, barW * chargePercent, barH);
        }

        // Release throw
        if (spaceJustUp && this.isCharging) {
            const chargePercent = Math.min((Date.now() - this.chargeStartTime) / this.maxChargeTime, 1);
            const chargeMultiplier = 1 + chargePercent; // 1.0× – 2.0×
            this.isCharging = false;
            this._destroyChargeGraphic();
            this.registerAttack();
            player.playAnimation('attack', false);
            const weaponManager = this.scene.weaponManager;
            if (weaponManager) {
                const direction = player.sprite.flipX ? 'left' : 'right';
                const spawnX = player.sprite.x + (direction === 'right' ? 20 : -20);
                const spawnY = player.sprite.y - 40;
                weaponManager.setWeaponType('spear');
                weaponManager.createWeapon(spawnX, spawnY, direction, null, chargeMultiplier);
            }
        }
    }

    /**
     * Check if restart key is pressed
     */
    isRestartPressed() {
        return this.keys && Phaser.Input.Keyboard.JustDown(this.keys.R);
    }

    /**
     * Check if escape key is pressed
     */
    isEscapePressed() {
        return this.keys && Phaser.Input.Keyboard.JustDown(this.keys.ESC);
    }

    /**
     * Update method called each frame
     */
    update() {
        // Handle global keys
        if (this.isEscapePressed()) {
            try {
                if (typeof window !== 'undefined') window.location.href = '/';
            } catch {
                /* ignore navigation errors */
            }
        }

        // Handle restart in game over state
        if (this.scene.gameState === 'gameOver' && this.isRestartPressed()) {
            this.scene.restartGame();
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        this._destroyChargeGraphic();
        this.keys = null;
        this.scene = null;
        this.physicsManager = null;
    }

    _destroyChargeGraphic() {
        if (this._chargeGraphic) {
            this._chargeGraphic.destroy();
            this._chargeGraphic = null;
        }
    }
}

export default InputHandler;
