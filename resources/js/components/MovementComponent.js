import Component from '../core/Component.js';

/**
 * Movement component - handles object movement and physics
 */
class MovementComponent extends Component {
    constructor(speed = 160, jumpPower = 330, doubleJumpPower = 280, maxJumps = 2) {
        super();
        this.speed = speed;
        this.jumpPower = jumpPower;
        this.doubleJumpPower = doubleJumpPower;
        this.maxJumps = maxJumps;
        this.jumpsRemaining = maxJumps;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isGrounded = false;
        this.facing = 'right';
    }

    onAttach() {
        // Ensure the game object has a physics body
        if (this.gameObject.sprite && this.gameObject.sprite.body) {
            this.body = this.gameObject.sprite.body;
        }
    }

    update(_deltaTime) {
        if (!this.enabled || !this.body) return;

        // Update facing direction based on movement
        if (this.velocityX > 0) {
            this.facing = 'right';
            this.gameObject.sprite.setFlipX(false);
        } else if (this.velocityX < 0) {
            this.facing = 'left';
            this.gameObject.sprite.setFlipX(true);
        }

        // Check if grounded and reset jump count
        this.isGrounded = this.body.touching.down;
        if (this.isGrounded) {
            this.jumpsRemaining = this.maxJumps;
        }
    }

    /**
     * Move left
     */
    moveLeft() {
        this.velocityX = -this.speed;
        if (this.body) {
            this.body.setVelocityX(this.velocityX);
        }
    }

    /**
     * Move right
     */
    moveRight() {
        this.velocityX = this.speed;
        if (this.body) {
            this.body.setVelocityX(this.velocityX);
        }
    }

    /**
     * Stop horizontal movement
     */
    stopHorizontal() {
        this.velocityX = 0;
        if (this.body) {
            this.body.setVelocityX(0);
        }
    }

    /**
     * Jump if jumps are available
     */
    jump() {
        if (this.jumpsRemaining > 0 && this.body) {
            // Use different jump power for double jump
            const power = this.jumpsRemaining === this.maxJumps ? this.jumpPower : this.doubleJumpPower;
            this.velocityY = -power;
            this.body.setVelocityY(this.velocityY);
            this.jumpsRemaining--;
            return true;
        }
        return false;
    }

    /**
     * Get remaining jumps
     */
    getJumpsRemaining() {
        return this.jumpsRemaining;
    }

    /**
     * Reset jumps (useful for special abilities or platforms)
     */
    resetJumps() {
        this.jumpsRemaining = this.maxJumps;
    }

    /**
     * Get current facing direction
     */
    getFacing() {
        return this.facing;
    }

    /**
     * Check if the object is moving
     */
    isMoving() {
        return Math.abs(this.velocityX) > 0;
    }

    /**
     * Check if the object is grounded
     */
    isOnGround() {
        return this.isGrounded;
    }
}

export default MovementComponent;
