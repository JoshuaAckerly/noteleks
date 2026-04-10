import GameConfig from '../config/GameConfig.js';
// import { MathUtils } from '../utils/GameUtils.js';

/**
 * Enemy Manager
 * Handles enemy spawning, lifecycle, and behavior coordination
 */
export class EnemyManager {
    constructor(scene) {
        this.scene = scene;
        this.config = GameConfig.enemies;
        this.enemies = null;
        this.spawnTimer = null;
        this.spawnCount = 0;
    }

    initialize() {
        // Create enemies physics group
        this.enemies = this.scene.physics.add.group();
        // Do NOT start automatic spawning. Spawning is now controlled by GameScene round logic.
    }

    startSpawning() {
        // Deprecated: No longer used. Spawning is controlled by GameScene.
    }

    stopSpawning() {
        if (this.spawnTimer) {
            this.spawnTimer.remove();
            this.spawnTimer = null;
        }
        // No-op otherwise
    }

    spawnEnemy() {
        if (this.scene.gameState !== 'playing') return;

        // Check if we've reached the maximum number of enemies
        if (this.config.maxEnemies && this.getEnemyCount() >= this.config.maxEnemies) {
            return;
        }

        const spawnPosition = this.calculateSpawnPosition();
        const enemyType = this.selectEnemyType();

        // Create enemy using EntityFactory
        const enemy = this.scene.entityFactory.createEnemy(spawnPosition.x, spawnPosition.y, enemyType);

        // Add to system manager and physics group
        this.scene.systemManager.addGameObject(enemy);
        this.enemies.add(enemy.getSprite());

        this.spawnCount++;
    }

    calculateSpawnPosition() {
        const cam      = this.scene.cameras.main;
        const worldW   = GameConfig.world?.width ?? 3200;
        const { maxFromEdge } = this.config.spawnDistance;

        // Pit zones mirrored from PlatformManager — never spawn inside a pit
        const pitZones = [[896, 1088], [1728, 1920], [2304, 2496], [2752, 2880]];
        const isInPit     = (x) => pitZones.some(([s, e]) => x > s && x < e);
        const isOnScreen  = (x) => x > cam.scrollX - 50 && x < cam.scrollX + cam.width + 50;
        const playerX     = this.scene.player?.sprite?.x ?? (cam.scrollX + cam.width / 2);
        const isTooClose  = (x) => Math.abs(x - playerX) < 250;

        // 60 % of spawns: pick a random position elsewhere in the world
        // so enemies exist throughout the level, not only at camera edges.
        if (Math.random() < 0.6) {
            for (let i = 0; i < 15; i++) {
                const x = 64 + Math.random() * (worldW - 128);
                if (!isInPit(x) && !isOnScreen(x) && !isTooClose(x)) {
                    const y = cam.height - maxFromEdge;
                    return { x, y };
                }
            }
        }

        // 40 % (or fallback): spawn just off the current camera edge
        const offscreen = 80;
        const spawnLeft = Math.random() < 0.5;
        const x = spawnLeft
            ? Math.max(32, cam.scrollX - offscreen)
            : Math.min(worldW - 32, cam.scrollX + cam.width + offscreen);
        const y = cam.height - maxFromEdge;
        return { x, y };
    }

    selectEnemyType() {
        const score = this.scene.gameUI ? this.scene.gameUI.getScore() : 0;

        // Boss spawn chance at high scores
        if (score > 500 && Math.random() < 0.1) {
            return 'boss';
        }

        // Progressive enemy types based on score
        if (score > 300) {
            const types = ['zombie', 'skeleton', 'ghost'];
            return Phaser.Utils.Array.GetRandom(types);
        } else if (score > 100) {
            const types = ['zombie', 'skeleton'];
            return Phaser.Utils.Array.GetRandom(types);
        }

        return 'zombie';
    }

    update(player) {
        // Update all enemies
        this.enemies.children.entries.forEach((enemySprite) => {
            const enemy = enemySprite.enemyRef;
            if (enemy && enemy.update) {
                enemy.update(player);
            }
        });
    }

    setupCollisions(player, weaponManager) {
        // Player vs enemies collision
        if (player && player.getSprite()) {
            this.scene.physics.add.overlap(player.getSprite(), this.enemies, this.handlePlayerEnemyCollision.bind(this), null, this.scene);
        }

        // Weapons vs enemies collision
        if (weaponManager) {
            weaponManager.setupEnemyCollisions(this.enemies);
        }
    }

    handlePlayerEnemyCollision(playerSprite, enemySprite) {
        const enemy = enemySprite.enemyRef;
        const player = playerSprite.playerRef;

        if (!enemy || !player) return;

        // Check if enemy is already stunned (prevents multiple collision triggers)
        const aiComponent = enemy.getComponent('ai');
        if (aiComponent && aiComponent.getIsStunned()) return;

        // Player takes damage
        const damageResult = player.takeDamage(enemy.getDamageAmount());

        // Particle effect on player hit
        if (this.scene.particleManager) {
            this.scene.particleManager.playerDamage(playerSprite.x, playerSprite.y);
        }

        // Update UI with current health
        if (this.scene.gameUI) {
            this.scene.gameUI.updateHealth(player.getHealth());
        }

        // Determine knockback directions
        const enemyDirection = enemySprite.x > playerSprite.x ? 'right' : 'left';
        const playerDirection = enemySprite.x > playerSprite.x ? 'left' : 'right';

        // Apply knockback to enemy using PhysicsManager
        if (this.scene.player && this.scene.player.physicsManager) {
            this.scene.player.physicsManager.applyKnockback(enemySprite, enemyDirection);
        }

        // Apply knockback to player (with shorter duration than enemy)
        if (player.applyKnockback) {
            player.applyKnockback(playerDirection, 300);
        }

        // Stun the enemy for 1 second (pause movement)
        if (aiComponent) {
            aiComponent.stun(1000);
        }

        // Enemy does NOT die from collision - just knockback and stun

        // Check for game over
        if (damageResult.died) {
            this.scene.gameOver();
        }
    }

    removeEnemy(enemy) {
        // Remove from system manager
        this.scene.systemManager.removeGameObject(enemy);

        // Remove from physics group
        if (enemy.getSprite()) {
            this.enemies.remove(enemy.getSprite());
        }

        // Destroy the enemy
        enemy.destroy();
    }

    clearAllEnemies() {
        this.enemies.children.entries.forEach((enemySprite) => {
            const enemy = enemySprite.enemyRef;
            if (enemy) {
                this.removeEnemy(enemy);
            }
        });

        this.enemies.clear(true, true);
    }

    getEnemyCount() {
        return this.enemies.children.entries.length;
    }

    getTotalSpawned() {
        return this.spawnCount;
    }

    reset() {
        this.stopSpawning();
        this.clearAllEnemies();
        this.spawnCount = 0;
        // Do NOT start automatic spawning. Spawning is controlled by GameScene.
    }

    shutdown() {
        this.stopSpawning();
        this.clearAllEnemies();
    }
}

export default EnemyManager;
