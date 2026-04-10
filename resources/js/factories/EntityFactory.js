import GameConfig from '../config/GameConfig.js';
import Enemy from '../entities/Enemy.js';
import Player from '../entities/Player.js';

/**
 * EntityFactory - Centralized entity creation and configuration
 * Provides templates and standardized creation methods for all game entities
 */
class EntityFactory {
    constructor(scene) {
        this.scene = scene;
        this.entityTemplates = this.initializeTemplates();
    }

    /**
     * Initialize entity templates with default configurations
     */
    initializeTemplates() {
        return {
            player: {
                sprite: 'skeleton-idle-0',
                scale: GameConfig.player.scale,
                depth: 100,
                physics: {
                    collideWorldBounds: true,
                    bounce: 0,
                    bodySize: { width: 60, height: 100 },
                    bodyOffset: { x: 48, y: 120 },
                },
            },
            enemies: {
                zombie: {
                    sprite: 'enemy',
                    tint: GameConfig.enemies.types.zombie.color,
                    scale: 1,
                    depth: 50,
                    physics: {
                        collideWorldBounds: true,
                        bounce: 0.1,
                        mass: GameConfig.combat.knockback.enemyMass,
                        drag: GameConfig.combat.knockback.enemyDrag,
                    },
                },
                skeleton: {
                    sprite: 'enemy',
                    tint: GameConfig.enemies.types.skeleton.color,
                    scale: 1,
                    depth: 50,
                    physics: {
                        collideWorldBounds: true,
                        bounce: 0.1,
                        mass: GameConfig.combat.knockback.enemyMass,
                        drag: GameConfig.combat.knockback.enemyDrag,
                    },
                },
                ghost: {
                    sprite: 'enemy',
                    tint: GameConfig.enemies.types.ghost.color,
                    scale: 1,
                    depth: 50,
                    physics: {
                        collideWorldBounds: true,
                        bounce: 0.1,
                        mass: GameConfig.combat.knockback.enemyMass,
                        drag: GameConfig.combat.knockback.enemyDrag,
                    },
                },
                boss: {
                    sprite: 'enemy',
                    tint: GameConfig.enemies.types.boss.color,
                    scale: 1.5,
                    depth: 50,
                    physics: {
                        collideWorldBounds: true,
                        bounce: 0.1,
                        mass: GameConfig.combat.knockback.enemyMass * 2,
                        drag: GameConfig.combat.knockback.enemyDrag,
                    },
                },
            },
            platforms: {
                ground: {
                    sprite: 'ground',
                    scale: { x: 1, y: 1 },
                    depth: 10,
                    static: true,
                },
                floating: {
                    sprite: 'ground',
                    scale: { x: 0.8, y: 0.5 },
                    depth: 10,
                    static: true,
                },
            },
        };
    }

    /**
     * Create a player entity
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {Object} overrides - Configuration overrides
     * @returns {Player}
     */
    createPlayer(x, y, overrides = {}) {
        const template = { ...this.entityTemplates.player, ...overrides };
        const player = new Player(this.scene, x, y);

        // Apply template configuration if needed
        if (player.sprite) {
            this.applyTemplate(player.sprite, template);
        }

        return player;
    }

    /**
     * Create an enemy entity
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} type - Enemy type
     * @param {Object} overrides - Configuration overrides
     * @returns {Enemy}
     */
    createEnemy(x, y, type = 'zombie', overrides = {}) {
        const template = { ...this.entityTemplates.enemies[type], ...overrides };
        const enemy = new Enemy(this.scene, x, y, type);

        // Apply template configuration if needed
        if (enemy.sprite) {
            this.applyTemplate(enemy.sprite, template);
        }

        return enemy;
    }

    /**
     * Create a platform
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} type - Platform type
     * @param {Object} overrides - Configuration overrides
     * @returns {Phaser.Physics.Arcade.StaticSprite}
     */
    createPlatform(x, y, type = 'ground', overrides = {}) {
        const template = { ...this.entityTemplates.platforms[type], ...overrides };

        const platform = this.scene.physics.add.staticSprite(x, y, template.sprite);
        this.applyTemplate(platform, template);

        if (template.static) {
            platform.refreshBody();
        }

        return platform;
    }

    /**
     * Create multiple entities from a configuration array
     * @param {Array} entityConfigs - Array of entity configurations
     * @returns {Array} Array of created entities
     */
    createEntitiesFromConfig(entityConfigs) {
        const entities = [];

        for (const config of entityConfigs) {
            let entity = null;

            switch (config.type) {
                case 'player':
                    entity = this.createPlayer(config.x, config.y, config.overrides);
                    break;
                case 'enemy':
                    entity = this.createEnemy(config.x, config.y, config.subtype, config.overrides);
                    break;
                case 'platform':
                    entity = this.createPlatform(config.x, config.y, config.subtype, config.overrides);
                    break;
            }

            if (entity) {
                entities.push(entity);
            }
        }

        return entities;
    }

    /**
     * Apply template configuration to a sprite
     * @param {Phaser.GameObjects.Sprite} sprite - Target sprite
     * @param {Object} template - Template configuration
     */
    applyTemplate(sprite, template) {
        if (template.tint) {
            sprite.setTint(template.tint);
        }

        if (template.scale) {
            if (typeof template.scale === 'number') {
                sprite.setScale(template.scale);
            } else {
                sprite.setScale(template.scale.x || 1, template.scale.y || 1);
            }
        }

        if (template.depth !== undefined) {
            sprite.setDepth(template.depth);
        }

        // Apply physics configuration
        if (template.physics && sprite.body) {
            const physics = template.physics;

            if (physics.collideWorldBounds) {
                sprite.body.setCollideWorldBounds(true);
            }

            if (physics.bounce !== undefined) {
                sprite.body.setBounce(physics.bounce);
            }

            if (physics.mass !== undefined) {
                sprite.body.setMass(physics.mass);
            }

            if (physics.drag !== undefined) {
                sprite.body.setDrag(physics.drag);
            }

            if (physics.bodySize) {
                sprite.body.setSize(physics.bodySize.width, physics.bodySize.height);
            }

            if (physics.bodyOffset) {
                sprite.body.setOffset(physics.bodyOffset.x, physics.bodyOffset.y);
            }
        }
    }

    /**
     * Get entity template
     * @param {string} entityType - Type of entity
     * @param {string} subtype - Subtype (optional)
     * @returns {Object} Template configuration
     */
    getTemplate(entityType, subtype = null) {
        if (subtype) {
            return this.entityTemplates[entityType]?.[subtype];
        }
        return this.entityTemplates[entityType];
    }

    /**
     * Register a new entity template
     * @param {string} entityType - Type of entity
     * @param {string} subtype - Subtype (optional)
     * @param {Object} template - Template configuration
     */
    registerTemplate(entityType, subtype, template) {
        if (subtype) {
            if (!this.entityTemplates[entityType]) {
                this.entityTemplates[entityType] = {};
            }
            this.entityTemplates[entityType][subtype] = template;
        } else {
            this.entityTemplates[entityType] = template;
        }
    }

    /**
     * Create entity pool for performance optimization
     * @param {string} entityType - Type of entity to pool
     * @param {string} subtype - Subtype (optional)
     * @param {number} poolSize - Size of the pool
     * @returns {Array} Array of pooled entities
     */
    createEntityPool(entityType, subtype, poolSize = 10) {
        const pool = [];

        for (let i = 0; i < poolSize; i++) {
            let entity = null;

            switch (entityType) {
                case 'enemy':
                    entity = this.createEnemy(0, 0, subtype);
                    entity.sprite.setVisible(false);
                    entity.sprite.setActive(false);
                    break;
                // Add other entity types as needed
            }

            if (entity) {
                pool.push(entity);
            }
        }

        return pool;
    }
}

export default EntityFactory;
