/**
 * Interface definitions for game systems
 * These define contracts that implementing classes must follow
 */

/**
 * Movable interface - for objects that can move
 * @interface
 */
export class IMovable {
    /**
     * Move the object
     * @param {number} velocityX - X velocity
     * @param {number} velocityY - Y velocity
     */
    move(_velocityX, _velocityY) {
        throw new Error('IMovable.move() must be implemented');
    }

    /**
     * Stop movement
     */
    stop() {
        throw new Error('IMovable.stop() must be implemented');
    }
}

/**
 * Damageable interface - for objects that can take damage
 * @interface
 */
export class IDamageable {
    /**
     * Take damage
     * @param {number} amount - Damage amount
     * @returns {boolean} - True if object was destroyed
     */
    takeDamage(_amount) {
        throw new Error('IDamageable.takeDamage() must be implemented');
    }

    /**
     * Get current health
     * @returns {number}
     */
    getHealth() {
        throw new Error('IDamageable.getHealth() must be implemented');
    }

    /**
     * Get maximum health
     * @returns {number}
     */
    getMaxHealth() {
        throw new Error('IDamageable.getMaxHealth() must be implemented');
    }
}

/**
 * Collidable interface - for objects that can collide
 * @interface
 */
export class ICollidable {
    /**
     * Handle collision with another object
     * @param {GameObject} other - Other object
     */
    onCollision(_other) {
        throw new Error('ICollidable.onCollision() must be implemented');
    }

    /**
     * Get collision bounds
     * @returns {Object} - Bounds object with x, y, width, height
     */
    getBounds() {
        throw new Error('ICollidable.getBounds() must be implemented');
    }
}

/**
 * Attackable interface - for objects that can attack
 * @interface
 */
export class IAttackable {
    /**
     * Perform attack
     * @param {Object} target - Target position or object
     */
    attack(_target) {
        throw new Error('IAttackable.attack() must be implemented');
    }

    /**
     * Check if can attack
     * @returns {boolean}
     */
    canAttack() {
        throw new Error('IAttackable.canAttack() must be implemented');
    }
}

/**
 * Poolable interface - for objects that can be pooled for performance
 * @interface
 */
export class IPoolable {
    /**
     * Reset object state for reuse
     */
    reset() {
        throw new Error('IPoolable.reset() must be implemented');
    }

    /**
     * Check if object is available for reuse
     * @returns {boolean}
     */
    isAvailable() {
        throw new Error('IPoolable.isAvailable() must be implemented');
    }
}
