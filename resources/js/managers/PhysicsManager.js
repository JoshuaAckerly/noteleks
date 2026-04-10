import GameConfig from '../config/GameConfig.js';

/**
 * PhysicsManager - Handles physics body setup, collisions, and effects
 * Extracted from Player and Enemy classes for better separation of concerns
 */
class PhysicsManager {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Setup physics body for player sprite
     * @param {Phaser.Physics.Arcade.Sprite} sprite - Player sprite
     */
    setupPlayerPhysics(sprite) {
        if (!sprite.body) return;

        sprite.body.setCollideWorldBounds(true);
        sprite.body.setBounce(0);
        // Set physics body to match skeleton body
        sprite.body.setSize(60, 100); // Character-sized collision
        sprite.body.setOffset(48, 120); // Center on skeleton body
    }

    /**
     * Setup physics body for enemy sprite
     * @param {Phaser.Physics.Arcade.Sprite} sprite - Enemy sprite
     */
    setupEnemyPhysics(sprite) {
        if (!sprite.body) return;

        const knockbackConfig = GameConfig.combat.knockback;
        sprite.body.setCollideWorldBounds(true);
        sprite.body.setBounce(0.1);
        sprite.body.setMass(knockbackConfig.enemyMass);
        sprite.body.setDrag(knockbackConfig.enemyDrag);
    }

    /**
     * Create a melee hitbox for attacks
     * @param {Object} attacker - The attacking entity
     * @param {Phaser.GameObjects.Group} targetGroup - Group to check collisions against
     * @param {Function} onHitCallback - Callback when hit occurs
     */
    createMeleeHitbox(attacker, targetGroup, onHitCallback) {
        try {
            // Determine facing direction from sprite flip
            const facing = attacker.sprite.flipX ? 'left' : 'right';
            const offsetX = facing === 'right' ? 20 : -20;

            const hx = attacker.sprite.x + offsetX;
            const hy = attacker.sprite.y - 20; // Position at character's hand/weapon level

            // Create hitbox zone
            const zone = this.scene.add.zone(hx, hy, 50, 100);
            this.scene.physics.world.enable(zone);

            if (zone.body) {
                zone.body.setAllowGravity(false);
                zone.body.setImmovable(true);
            }

            // Track which entities have been hit by this attack
            const hitEntities = new Set();

            // Handle collisions
            if (targetGroup) {
                const hitCallback = (z, targetSprite) => {
                    const targetRef = targetSprite?.enemyRef || targetSprite?.playerRef;
                    if (targetRef && !hitEntities.has(targetRef)) {
                        hitEntities.add(targetRef);

                        if (onHitCallback) {
                            onHitCallback(targetRef, targetSprite, facing);
                        }
                    }
                };

                this.scene.physics.add.overlap(zone, targetGroup, hitCallback);
            }

            // Remove hitbox after short duration
            setTimeout(() => {
                if (zone?.destroy) zone.destroy();
            }, 200);

            return zone;
        } catch (e) {
            console.warn('[PhysicsManager] Failed to create melee hitbox:', e.message);
            return null;
        }
    }

    /**
     * Apply knockback effect to a target
     * @param {Phaser.Physics.Arcade.Sprite} targetSprite - Target sprite
     * @param {string} direction - Direction of knockback ('left' or 'right')
     */
    applyKnockback(targetSprite, direction) {
        if (!targetSprite.body) return;

        const knockbackConfig = GameConfig.combat.knockback;
        const attackDirection = direction === 'left' ? -1 : 1;

        // Ensure target body has proper physics properties for knockback
        targetSprite.body.setMass(knockbackConfig.enemyMass);
        targetSprite.body.setDrag(knockbackConfig.enemyDrag);

        // Apply knockback velocity
        targetSprite.body.setVelocityX(knockbackConfig.forceX * attackDirection);
        targetSprite.body.setVelocityY(knockbackConfig.forceY);
    }

    /**
     * Setup collision between two physics objects
     * @param {Phaser.Physics.Arcade.Sprite|Phaser.GameObjects.Group} object1
     * @param {Phaser.Physics.Arcade.Sprite|Phaser.GameObjects.Group} object2
     * @param {Function} callback - Optional collision callback
     */
    setupCollision(object1, object2, callback = null) {
        if (object1 && object2) {
            this.scene.physics.add.collider(object1, object2, callback);
        }
    }

    /**
     * Setup overlap detection between two physics objects
     * @param {Phaser.Physics.Arcade.Sprite|Phaser.GameObjects.Group} object1
     * @param {Phaser.Physics.Arcade.Sprite|Phaser.GameObjects.Group} object2
     * @param {Function} callback - Overlap callback
     */
    setupOverlap(object1, object2, callback) {
        if (object1 && object2 && callback) {
            this.scene.physics.add.overlap(object1, object2, callback);
        }
    }

    /**
     * Reset physics body velocity
     * @param {Phaser.Physics.Arcade.Sprite} sprite
     */
    resetVelocity(sprite) {
        if (sprite.body) {
            sprite.body.setVelocity(0, 0);
        }
    }

    /**
     * Set horizontal velocity
     * @param {Phaser.Physics.Arcade.Sprite} sprite
     * @param {number} velocityX
     */
    setVelocityX(sprite, velocityX) {
        if (sprite.body) {
            sprite.body.setVelocityX(velocityX);
        }
    }

    /**
     * Set vertical velocity
     * @param {Phaser.Physics.Arcade.Sprite} sprite
     * @param {number} velocityY
     */
    setVelocityY(sprite, velocityY) {
        if (sprite.body) {
            sprite.body.setVelocityY(velocityY);
        }
    }

    /**
     * Check if sprite is touching down (on ground)
     * @param {Phaser.Physics.Arcade.Sprite} sprite
     * @returns {boolean}
     */
    isTouchingDown(sprite) {
        return sprite.body && sprite.body.touching.down;
    }
}

export default PhysicsManager;
