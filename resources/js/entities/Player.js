import AttackComponent from '../components/AttackComponent.js';
import HealthComponent from '../components/HealthComponent.js';
import InputComponent from '../components/InputComponent.js';
import MovementComponent from '../components/MovementComponent.js';
import PhysicsComponent from '../components/PhysicsComponent.js';
import GameConfig from '../config/GameConfig.js';
import GameObject from '../core/GameObject.js';
import AnimationManager from '../managers/AnimationManager.js';
import InputHandler from '../managers/InputHandler.js';
import PhysicsManager from '../managers/PhysicsManager.js';

/**
 * Player Entity - Clean Version
 * Simplified player character with essential functionality only
 */
class Player extends GameObject {
    constructor(scene, x, y) {
        super(scene, x, y);

        // Animation states
        this._isJumping = false;
        this._isAttacking = false;
        this._attackLocked = false; // Lock player during attack
        this.animationManager = null;
        this.spineObject = null;
        this._spineAnimationListener = null;

        // Knockback state
        this.isKnockedBack = false;
        this.knockbackEndTime = 0;

        // Landing detection for particles
        this._wasGrounded = false;

        // Input handler
        this.inputHandler = new InputHandler(scene);

        // Physics manager
        this.physicsManager = new PhysicsManager(scene);

        // Create player and setup components
        this.createPlayer();
        this.setupComponents();
    }

    createPlayer() {
        const fallbackTexture = this.getFallbackTextureKey();
        this.sprite = this.scene.physics.add.sprite(this.x, this.y, fallbackTexture);
        this.sprite.playerRef = this;
        this.sprite.setOrigin(0.5, 1);
        this.sprite.setScale(GameConfig.player.scale);
        this.sprite.setDepth(100);

        // Setup physics using PhysicsManager
        this.physicsManager.setupPlayerPhysics(this.sprite);

        this.spineObject = this.createSpineVisual();
        this.sprite.setVisible(!this.spineObject);

        // Initialize animation manager
        this.animationManager = new AnimationManager(this.sprite, this.scene, this.spineObject);
        this.animationManager.play('player-idle', true);

        // Listen for animation complete to reset attack state
        this.sprite.on('animationcomplete', (animation) => {
            if (animation.key === 'player-attack') {
                this.handleAttackAnimationComplete();
            }
        });

        if (this.spineObject?.animationState?.addListener) {
            this._spineAnimationListener = {
                complete: (entry) => {
                    const name = entry?.animation?.name;
                    if (name === 'Attack1' || name === 'Attack2') {
                        this.handleAttackAnimationComplete();
                    }
                },
            };
            this.spineObject.animationState.addListener(this._spineAnimationListener);
        }

        this.syncVisualToPhysics();

        if (typeof window !== 'undefined') {
            window.noteleksPlayer = this;
        }


    }

    getFallbackTextureKey() {
        if (this.scene?.textures?.exists('skeleton-idle')) return 'skeleton-idle';
        if (this.scene?.textures?.exists('skeleton-idle-0')) return 'skeleton-idle-0';
        if (this.scene?.textures?.exists('skeleton')) return 'skeleton';
        return 'skeleton';
    }

    createSpineVisual() {
        if (!(GameConfig.useSpine && this.scene?.add?.spine && GameConfig.assets?.spine)) {
            return null;
        }

        try {
            const spineObject = this.scene.add.spine(
                this.x,
                this.y,
                GameConfig.assets.spine.dataKey,
                GameConfig.assets.spine.atlasKey,
            );
            spineObject.setDepth(100);
            spineObject.setScale(GameConfig.player.scale, GameConfig.player.scale);
            return spineObject;
        } catch (e) {
            console.warn('[Player] Failed to create Spine visual:', e.message);
            GameConfig.useSpine = false;
            return null;
        }
    }

    syncVisualToPhysics() {
        if (!this.spineObject || !this.sprite) return;

        const offset = GameConfig.player.spineOffset || { x: 0, y: 0 };
        const scale = GameConfig.player.scale;

        if (this.spineObject.setPosition) {
            this.spineObject.setPosition(this.sprite.x + offset.x, this.sprite.y + offset.y);
        } else {
            this.spineObject.x = this.sprite.x + offset.x;
            this.spineObject.y = this.sprite.y + offset.y;
        }

        if (this.spineObject.setScale) {
            this.spineObject.setScale(this.sprite.flipX ? -scale : scale, scale);
        }

        if (this.spineObject.setVisible) {
            this.spineObject.setVisible(true);
        }
    }

    handleAttackAnimationComplete() {
        this._isAttacking = false;
        this._attackLocked = false;
        this.playAnimation('idle', true);
    }



    playAnimation(name, loop = true) {
        if (!this.animationManager) return;

        // Map game animation names to player animation names
        let animKey = null;
        if (name === 'idle') {
            animKey = 'player-idle';
            this._isAttacking = false;
        } else if (name === 'run') {
            animKey = 'player-run';
            this._isAttacking = false;
        } else if (name === 'attack') {
            animKey = 'player-attack';
            loop = false; // Attack should never loop
            this._isAttacking = true;
            this._attackLocked = true;
        } else if (name === 'jump') {
            animKey = 'player-jump';
            this._isAttacking = false;
        }

        if (animKey) {
            this.animationManager.play(animKey, loop);
        }
    }

    setupComponents() {
        const config = GameConfig.player;

        // Add physics component
        this.addComponent(
            'physics',
            new PhysicsComponent({
                bounce: 0.2,
                collideWorldBounds: true,
            }),
        );

        // Add movement component with double jump support
        this.addComponent('movement', new MovementComponent(config.speed, config.jumpPower, config.doubleJumpPower, config.maxJumps));

        // Add health component
        this.addComponent('health', new HealthComponent(config.health, config.maxHealth));

        // Add input component
        this.addComponent('input', new InputComponent());

        // Add attack component
        this.addComponent('attack', new AttackComponent());

        // Setup component callbacks
        this.setupComponentCallbacks();
    }

    setupComponentCallbacks() {
        // Health component callbacks
        const healthComponent = this.getComponent('health');
        healthComponent.onDeath(() => {
            this.scene.gameOver();
        });

        // Attack component callbacks
        const attackComponent = this.getComponent('attack');
        attackComponent.onAttack(() => {
            // Handle attack logic here if needed
        });
    }

    update() {
        if (this.scene.gameState !== 'playing') return;
        if (!this.sprite || !this.sprite.body) return;

        // Check if knockback has expired
        if (this.isKnockedBack && Date.now() > this.knockbackEndTime) {
            this.isKnockedBack = false;
        }

        // Only process input if not knocked back AND not attack-locked
        if (!this.isKnockedBack && !this._attackLocked) {
            // Get input state from InputHandler
            const inputState = this.inputHandler.getInputState();
            if (inputState) {
                this.inputHandler.processPlayerInput(this, inputState);
            }
        } else if (this._attackLocked) {
            // During attack: decelerate horizontally but don't hard-freeze.
            // This keeps momentum feeling natural instead of a jarring stop.
            const vx = this.sprite.body?.velocity?.x ?? 0;
            this.physicsManager.setVelocityX(this.sprite, vx * 0.8);
        }

        // Update InputHandler
        this.inputHandler.update();

        // Landing particle: fire once when transitioning from air to ground
        const movement = this.getComponent('movement');
        if (movement) {
            const grounded = movement.isGrounded;
            if (grounded && !this._wasGrounded && this.sprite) {
                this.scene.particleManager?.landing(this.sprite.x, this.sprite.y);
            }
            this._wasGrounded = grounded;
        }

        this.syncVisualToPhysics();
    }

    createMeleeHitbox() {
        const enemyGroup = this.scene.enemyManager?.enemies;
        if (!enemyGroup) return;

        const onHitCallback = (enemy, enemySprite, facing) => {
            // Apply knockback
            this.physicsManager.applyKnockback(enemySprite, facing);

            // Stun the enemy
            const aiComponent = enemy.getComponent('ai');
            if (aiComponent) {
                const knockbackConfig = GameConfig.combat.knockback;
                aiComponent.stun(knockbackConfig.stunDuration);
            }

            // Apply damage
            const damage = 1;
            const score = enemy.takeDamage(damage);

            if (score && this.scene.addScore) {
                this.scene.addScore(score);
            }
        };

        this.physicsManager.createMeleeHitbox(this, enemyGroup, onHitCallback);
    }

    takeDamage(amount) {
        const healthComponent = this.getComponent('health');
        if (healthComponent) {
            return healthComponent.takeDamage(amount);
        }
        return { died: false, currentHealth: 0 };
    }

    heal(amount) {
        const healthComponent = this.getComponent('health');
        if (healthComponent) {
            healthComponent.heal(amount);
        }
    }

    getHealth() {
        const healthComponent = this.getComponent('health');
        return healthComponent ? healthComponent.getHealth() : 0;
    }

    getMaxHealth() {
        const healthComponent = this.getComponent('health');
        return healthComponent ? healthComponent.getMaxHealth() : 0;
    }

    isAlive() {
        const healthComponent = this.getComponent('health');
        return healthComponent ? healthComponent.isAlive() : false;
    }

    applyKnockback(direction, duration = 500) {
        this.isKnockedBack = true;
        this.knockbackEndTime = Date.now() + duration;

        // Apply knockback through physics manager
        if (this.sprite && this.physicsManager) {
            this.physicsManager.applyKnockback(this.sprite, direction);
        }
    }

    reset(x, y) {
        // Reset position
        this.setPosition(x, y);

        // Reset health
        const healthComponent = this.getComponent('health');
        if (healthComponent) {
            healthComponent.reset();
        }

        // Reset movement and jumps
        const movementComponent = this.getComponent('movement');
        if (movementComponent) {
            movementComponent.stopHorizontal();
            movementComponent.resetJumps();
        }

        // Reset sprite
        if (this.sprite) {
            this.sprite.setPosition(x, y);
            this.physicsManager.resetVelocity(this.sprite);
        }

        this.syncVisualToPhysics();

        // Reset animation states
        this._isJumping = false;
        this._isAttacking = false;
        this.playAnimation('idle', true);
    }

    destroy() {
        if (this._spineAnimationListener && this.spineObject?.animationState?.removeListener) {
            this.spineObject.animationState.removeListener(this._spineAnimationListener);
            this._spineAnimationListener = null;
        }

        if (this.spineObject) {
            this.spineObject.destroy();
            this.spineObject = null;
        }

        // Clean up weapon sprite
        if (this.weaponSprite) {
            this.weaponSprite.destroy();
            this.weaponSprite = null;
        }

        // Clean up InputHandler
        if (this.inputHandler) {
            this.inputHandler.destroy();
            this.inputHandler = null;
        }

        // Clean up PhysicsManager reference
        this.physicsManager = null;

        // Call parent destroy if it exists
        if (super.destroy) {
            super.destroy();
        }
    }
}

export default Player;
