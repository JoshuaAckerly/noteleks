import Component from '../core/Component.js';

/**
 * Attack component - handles attack behavior and cooldowns
 */
class AttackComponent extends Component {
    constructor(attackCooldown = 500, damage = 20) {
        super();
        this.attackCooldown = attackCooldown;
        this.damage = damage;
        this.lastAttackTime = 0;
        this.isAttacking = false;
        this.onAttackCallbacks = [];
    }

    update(_deltaTime) {
        if (!this.enabled) return;

        // Update attack state
        const currentTime = Date.now();
        if (this.isAttacking && currentTime - this.lastAttackTime > this.attackCooldown) {
            this.isAttacking = false;
        }
    }

    /**
     * Attempt to attack
     * @param {Object} target - Target position or object
     * @returns {boolean} - True if attack was performed
     */
    attack(target = null) {
        if (!this.canAttack()) {
            return false;
        }

        this.isAttacking = true;
        this.lastAttackTime = Date.now();

        // Get facing direction from movement component if available
        const movementComponent = this.gameObject.getComponent('movement');
        const facing = movementComponent ? movementComponent.getFacing() : 'right';

        // Trigger attack callbacks
        this.onAttackCallbacks.forEach((callback) => {
            callback(target, facing, this.damage);
        });

        return true;
    }

    /**
     * Check if can attack (not on cooldown)
     */
    canAttack() {
        const currentTime = Date.now();
        return !this.isAttacking && currentTime - this.lastAttackTime >= this.attackCooldown;
    }

    /**
     * Check if currently attacking
     */
    isCurrentlyAttacking() {
        return this.isAttacking;
    }

    /**
     * Get remaining cooldown time
     */
    getRemainingCooldown() {
        const currentTime = Date.now();
        const timeSinceAttack = currentTime - this.lastAttackTime;
        return Math.max(0, this.attackCooldown - timeSinceAttack);
    }

    /**
     * Set attack damage
     */
    setDamage(damage) {
        this.damage = damage;
    }

    /**
     * Get attack damage
     */
    getDamage() {
        return this.damage;
    }

    /**
     * Set attack cooldown
     */
    setCooldown(cooldown) {
        this.attackCooldown = cooldown;
    }

    /**
     * Add callback for when attack is performed
     */
    onAttack(callback) {
        this.onAttackCallbacks.push(callback);
    }

    /**
     * Reset attack state
     */
    reset() {
        this.isAttacking = false;
        this.lastAttackTime = 0;
    }
}

export default AttackComponent;
