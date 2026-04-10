import GameConfig from '../config/GameConfig.js';
import Component from '../core/Component.js';

/**
 * AI component - handles artificial intelligence behavior for NPCs
 */
class AIComponent extends Component {
    constructor(aiType = 'basic') {
        super();
        this.aiType = aiType;
        this.target = null;
        this.config = GameConfig.enemies.types[aiType] || GameConfig.enemies.types.zombie;

        // Set properties from config
        this.speed = this.config.speed;
        this.detectionRange = this.config.detectionRange;

        // Stun system for knockback
        this.isStunned = false;
        this.stunEndTime = 0;
    }

    update(_deltaTime) {
        if (!this.enabled || !this.target) return;

        // Check if stun has expired
        if (this.isStunned && Date.now() > this.stunEndTime) {
            this.isStunned = false;
        }

        // Don't move if stunned
        if (this.isStunned) {
            // While stunned, don't apply AI movement but let physics handle velocity
            return;
        }

        // Simple AI: just move toward the player
        this.chaseTarget();
    }

    chaseTarget() {
        const movementComponent = this.gameObject.getComponent('movement');
        if (!movementComponent) {
            return;
        }

        const targetPos = this.getTargetPosition();
        if (!targetPos) {
            return;
        }

        const myPos = this.gameObject.getPosition();
        const distance = this.getDistanceToTarget();

        // Only move if target is within detection range
        if (distance > this.detectionRange) {
            movementComponent.stopHorizontal();
            return;
        }

        // Simple horizontal movement with a small threshold to prevent jittering
        const horizontalDistance = targetPos.x - myPos.x;
        const threshold = 5; // Small threshold to prevent oscillation

        if (horizontalDistance > threshold) {
            // Ledge check before moving right
            if (movementComponent.isOnGround() && !this.hasGroundAhead(1) && targetPos.y < myPos.y + 80) {
                movementComponent.stopHorizontal();
            } else {
                movementComponent.moveRight();
            }
        } else if (horizontalDistance < -threshold) {
            // Ledge check before moving left
            if (movementComponent.isOnGround() && !this.hasGroundAhead(-1) && targetPos.y < myPos.y + 80) {
                movementComponent.stopHorizontal();
            } else {
                movementComponent.moveLeft();
            }
        } else {
            movementComponent.stopHorizontal();
        }

        // Simple jump if target is above
        if (targetPos.y < myPos.y - 60 && movementComponent.isOnGround()) {
            movementComponent.jump();
        }
    }

    /**
     * Check whether there is solid ground one step ahead in the given direction.
     * Prevents enemies from blindly walking off platform edges.
     *
     * @param {number} direction - +1 for right, -1 for left
     * @returns {boolean} true if ground exists ahead, false if it is a ledge
     */
    hasGroundAhead(direction) {
        const sprite    = this.gameObject?.sprite;
        const platforms = this.gameObject?.scene?.platforms;
        if (!sprite || !sprite.body || !platforms) return true; // assume safe when data unavailable

        const body   = sprite.body;
        // Probe: one half-body width ahead + small margin, one tile height below feet
        const probeX = sprite.x + direction * (body.halfWidth + 10);
        const probeY = sprite.y + body.halfHeight + 10;

        return platforms.getChildren().some((tile) => {
            const b = tile.body;
            if (!b) return false;
            return probeX >= b.left && probeX <= b.right && probeY >= b.top && probeY <= b.bottom;
        });
    }

    setTarget(target) {
        this.target = target;
    }

    getTarget() {
        return this.target;
    }

    getDistanceToTarget() {
        if (!this.target) return Infinity;

        const targetPos = this.getTargetPosition();
        if (!targetPos) return Infinity;

        const myPos = this.gameObject.getPosition();

        const dx = targetPos.x - myPos.x;
        const dy = targetPos.y - myPos.y;

        return Math.sqrt(dx * dx + dy * dy);
    }

    setDetectionRange(range) {
        this.detectionRange = range;
    }

    setSpeed(speed) {
        this.speed = speed;
        const movementComponent = this.gameObject.getComponent('movement');
        if (movementComponent) {
            movementComponent.speed = speed;
        }
    }

    /**
     * Helper method to get target position safely
     * Handles both GameObject instances and legacy sprite objects
     */
    getTargetPosition() {
        if (!this.target) {
            return null;
        }

        // GameObject with getPosition method
        if (this.target.getPosition) {
            return this.target.getPosition();
        }

        // Legacy object with sprite property
        if (this.target.sprite) {
            return { x: this.target.sprite.x, y: this.target.sprite.y };
        }

        // Direct x,y properties
        if (this.target.x !== undefined && this.target.y !== undefined) {
            return { x: this.target.x, y: this.target.y };
        }

        return null;
    }

    /**
     * Stun the enemy for a specified duration
     * @param {number} duration - Stun duration in milliseconds
     */
    stun(duration) {
        this.isStunned = true;
        this.stunEndTime = Date.now() + duration;

        // Don't stop movement here - let physics handle the knockback velocity
    }

    /**
     * Check if enemy is currently stunned
     */
    getIsStunned() {
        return this.isStunned;
    }
}

export default AIComponent;
