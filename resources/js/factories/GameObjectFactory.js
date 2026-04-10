import Enemy from '../entities/Enemy.js';
import Player from '../entities/Player.js';

/**
 * Factory for creating game objects with proper component setup
 */
class GameObjectFactory {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Create a player instance
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {Player}
     */
    createPlayer(x, y) {
        return new Player(this.scene, x, y);
    }

    /**
     * Create an enemy instance
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} type - Enemy type
     * @returns {Enemy}
     */
    createEnemy(x, y, type = 'zombie') {
        return new Enemy(this.scene, x, y, type);
    }

    /**
     * Create a projectile/weapon
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} weaponType - Type of weapon
     * @param {string} direction - Direction to fire
     * @param {Object} target - Target position (optional)
     * @returns {GameObject}
     */
    createWeapon(x, y, weaponType, direction, target = null) {
        // This would be implemented based on weapon system
        // For now, delegate to existing weapon manager
        if (this.scene.weaponManager) {
            return this.scene.weaponManager.createWeapon(x, y, direction, target);
        }
        return null;
    }

    /**
     * Create a pickup/powerup
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} type - Pickup type
     * @returns {GameObject}
     */
    createPickup(_x, _y, _type) {
        // Future implementation for pickups/powerups
        // Would create objects with pickup components
        return null;
    }

    /**
     * Create a platform
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Platform width
     * @param {number} height - Platform height
     * @returns {GameObject}
     */
    createPlatform(x, y, width = 64, height = 32) {
        // Create static platform with physics
        const platform = this.scene.physics.add.staticSprite(x, y, 'ground');
        platform.setScale(width / 64, height / 32);
        platform.refreshBody();
        return platform;
    }
}

export default GameObjectFactory;
