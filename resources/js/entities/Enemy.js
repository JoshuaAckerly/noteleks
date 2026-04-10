import AIComponent from '../components/AIComponent.js';
import HealthComponent from '../components/HealthComponent.js';
import MovementComponent from '../components/MovementComponent.js';
import PhysicsComponent from '../components/PhysicsComponent.js';
import GameConfig from '../config/GameConfig.js';
import GameObject from '../core/GameObject.js';
import PhysicsManager from '../managers/PhysicsManager.js';

/**
 * Enemy Entity
 * Represents various enemy types with AI, movement, health, and physics components
 */
class Enemy extends GameObject {
    constructor(scene, x, y, type = 'zombie') {
        super(scene, x, y);
        this.type = type;
        this.config = GameConfig.enemies.types[type] || GameConfig.enemies.types.zombie;

        // Physics manager
        this.physicsManager = new PhysicsManager(scene);

        this.createEnemy();
        this.setupComponents();
    }

    createEnemy() {
        // Create enemy sprite with physics
        this.sprite = this.scene.physics.add.sprite(this.x, this.y, 'enemy');
        this.sprite.setTint(this.config.color);

        // Setup physics using PhysicsManager
        this.physicsManager.setupEnemyPhysics(this.sprite);

        // Store reference to this enemy class in the sprite
        this.sprite.enemyRef = this;
    }

    setupComponents() {
        // Add physics component
        this.addComponent(
            'physics',
            new PhysicsComponent({
                bounce: 0.2,
                collideWorldBounds: true,
                bodyWidth: 32,
                bodyHeight: 40,
            }),
        );

        // Add movement component
        this.addComponent('movement', new MovementComponent(this.config.speed, this.config.jumpPower));

        // Add health component
        this.addComponent('health', new HealthComponent(this.config.health, 100));

        // Add AI component
        this.addComponent('ai', new AIComponent(this.type));

        // Setup component callbacks
        this.setupComponentCallbacks();

        // Setup physics colliders using PhysicsManager
        this.physicsManager.setupCollision(this.sprite, this.scene.platforms);
    }

    setupComponentCallbacks() {
        // Health component callbacks
        const healthComponent = this.getComponent('health');
        healthComponent.onDeath(() => {
            // Award score and destroy enemy
            this.scene.addScore(this.config.score);
            if (this.scene.particleManager && this.sprite) {
                this.scene.particleManager.enemyDeath(
                    this.sprite.x,
                    this.sprite.y,
                    this.config.color,
                );
            }
            this.destroy();
        });
    }

    update(player) {
        if (this.scene.gameState !== 'playing') return;

        // Update all components
        super.update(16); // 16ms for 60fps

        // Prevent enemy from leaving horizontal world bounds (not vertical — allow pit falls)
        if (this.sprite && this.sprite.body) {
            const bounds = this.scene.physics.world.bounds;
            if (this.sprite.x < bounds.x) {
                this.sprite.x = bounds.x;
                this.sprite.body.setVelocityX(0);
            } else if (this.sprite.x > bounds.right) {
                this.sprite.x = bounds.right;
                this.sprite.body.setVelocityX(0);
            }
            // Y is intentionally unclamped so enemies fall into pits and are cleaned up
            // by GameScene.handleGameplayUpdate()'s pit-death check.
        }

        // Set AI target to player - validate that player is an object with the expected structure
        const aiComponent = this.getComponent('ai');
        if (aiComponent && player && typeof player === 'object' && player.getPosition) {
            aiComponent.setTarget(player);
        } else if (aiComponent) {
            // Try to get player from scene directly as fallback
            const scenePlayer = this.scene.player;
            if (scenePlayer && typeof scenePlayer === 'object' && scenePlayer.getPosition) {
                aiComponent.setTarget(scenePlayer);
            }
        }
    }

    takeDamage(amount = 1) {
        const healthComponent = this.getComponent('health');
        if (healthComponent) {
            const died = healthComponent.takeDamage(amount);
            return died ? this.config.score : 0;
        }
        return 0;
    }

    getType() {
        return this.type;
    }

    getDamageAmount() {
        return this.config.damage;
    }

    getHealth() {
        const healthComponent = this.getComponent('health');
        return healthComponent ? healthComponent.getHealth() : 0;
    }

    isAlive() {
        const healthComponent = this.getComponent('health');
        return healthComponent ? healthComponent.isAlive() : false;
    }

    getConfig() {
        return this.config;
    }
}

export default Enemy;
