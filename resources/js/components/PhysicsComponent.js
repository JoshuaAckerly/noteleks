import Component from '../core/Component.js';

/**
 * Physics component - handles physics body setup and management
 */
class PhysicsComponent extends Component {
    constructor(options = {}) {
        super();
        this.bounce = options.bounce || 0.2;
        this.collideWorldBounds = options.collideWorldBounds !== false;
        this.bodyWidth = options.bodyWidth || null;
        this.bodyHeight = options.bodyHeight || null;
        this.bodyOffsetX = options.bodyOffsetX || 0;
        this.bodyOffsetY = options.bodyOffsetY || 0;
        this.isStatic = options.isStatic || false;
    }

    onAttach() {
        if (!this.gameObject.sprite) return;

        // Add physics to the sprite if it doesn't already have a body
        if (!this.gameObject.sprite.body) {
            this.gameObject.scene.physics.add.existing(this.gameObject.sprite, this.isStatic);
        }

        if (this.gameObject.sprite.body) {
            this.body = this.gameObject.sprite.body;
            this.setupPhysicsProperties();
        }
    }

    setupPhysicsProperties() {
        if (!this.body) return;

        // Set basic physics properties
        this.body.setBounce(this.bounce);
        this.body.setCollideWorldBounds(this.collideWorldBounds);

        // Set custom body size if specified
        if (this.bodyWidth && this.bodyHeight) {
            this.body.setSize(this.bodyWidth, this.bodyHeight);
        }

        // Set body offset if specified
        if (this.bodyOffsetX !== 0 || this.bodyOffsetY !== 0) {
            this.body.setOffset(this.bodyOffsetX, this.bodyOffsetY);
        }
    }

    /**
     * Set velocity
     */
    setVelocity(x, y) {
        if (this.body) {
            this.body.setVelocity(x, y);
        }
    }

    /**
     * Set X velocity
     */
    setVelocityX(x) {
        if (this.body) {
            this.body.setVelocityX(x);
        }
    }

    /**
     * Set Y velocity
     */
    setVelocityY(y) {
        if (this.body) {
            this.body.setVelocityY(y);
        }
    }

    /**
     * Get velocity
     */
    getVelocity() {
        return this.body ? { x: this.body.velocity.x, y: this.body.velocity.y } : { x: 0, y: 0 };
    }

    /**
     * Check if touching down (grounded)
     */
    isTouchingDown() {
        return this.body ? this.body.touching.down : false;
    }

    /**
     * Check if touching up
     */
    isTouchingUp() {
        return this.body ? this.body.touching.up : false;
    }

    /**
     * Check if touching left
     */
    isTouchingLeft() {
        return this.body ? this.body.touching.left : false;
    }

    /**
     * Check if touching right
     */
    isTouchingRight() {
        return this.body ? this.body.touching.right : false;
    }

    /**
     * Set body size
     */
    setBodySize(width, height) {
        if (this.body) {
            this.body.setSize(width, height);
        }
    }

    /**
     * Set body offset
     */
    setBodyOffset(x, y) {
        if (this.body) {
            this.body.setOffset(x, y);
        }
    }

    /**
     * Get physics body
     */
    getBody() {
        return this.body;
    }
}

export default PhysicsComponent;
