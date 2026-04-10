/* global Phaser */

/**
 * WeaponManager class handles all projectiles and weapons in the game
 */
class WeaponManager {
    constructor(scene) {
        this.scene = scene;
        this.weapons = null;
        this.weaponTypes = {
            spear:     { speed: 520, damage: 2, sprite: 'spear'     },
            dagger:    { speed: 300, damage: 1, sprite: 'dagger'    },
            fireball:  { speed: 250, damage: 2, sprite: 'fireball'  },
            arrow:     { speed: 400, damage: 1, sprite: 'arrow'     },
            magic_bolt:{ speed: 350, damage: 3, sprite: 'magic_bolt'},
        };
        this.currentWeaponType = 'spear';

        this.createWeaponGroup();
    }

    createWeaponGroup() {
        this.weapons = this.scene.physics.add.group();

        // Note: Collision setup moved to setupCollisions() method in GameScene
        // to ensure enemies group exists first
    }

    setupEnemyCollisions(enemiesGroup) {
        // Setup collision with enemies - bind context to WeaponManager
        this.scene.physics.add.overlap(this.weapons, enemiesGroup, this.hitEnemy, null, this);
    }

    createWeapon(x, y, direction = 'right', pointer = null) {
        const weaponConfig = this.weaponTypes[this.currentWeaponType];
        const weapon = this.weapons.create(x, y, weaponConfig.sprite);

        // Store weapon properties
        weapon.weaponType = this.currentWeaponType;
        weapon.damage = weaponConfig.damage;
        weapon.startTime = this.scene.time.now;

        if (pointer) {
            // Throw toward mouse/touch position
            const angle = Phaser.Math.Angle.Between(x, y, pointer.x, pointer.y);
            this.scene.physics.velocityFromAngle((angle * 180) / Math.PI, weaponConfig.speed, weapon.body.velocity);
            weapon.setRotation(angle);
        } else {
            // Throw in facing direction with a very slight arc
            const velocityX = direction === 'right' ? weaponConfig.speed : -weaponConfig.speed;
            weapon.setVelocityX(velocityX);
            weapon.setVelocityY(-60);
            // Rotate the spear to face direction of travel
            weapon.setRotation(direction === 'right' ? 0 : Math.PI);
        }

        // Spear spins in flight; other weapons also spin
        weapon.setAngularVelocity(direction === 'right' ? 400 : -400);
        // Scale spear to roughly match the player's on-screen size
        if (this.currentWeaponType === 'spear') {
            weapon.setScale(0.15);
        }

        return weapon;
    }

    update() {
        // Clean up weapons that are off-screen or too old
        this.weapons.children.entries.forEach((weapon) => {
            const age = this.scene.time.now - weapon.startTime;

            // Remove if off-screen or older than 3 seconds
            if (
                weapon.x > this.scene.cameras.main.worldView.right + 50 ||
                weapon.x < this.scene.cameras.main.worldView.left - 50 ||
                weapon.y > this.scene.cameras.main.worldView.bottom + 50 ||
                age > 3000
            ) {
                weapon.destroy();
            }
        });
    }

    hitEnemy(weapon, enemySprite) {
        // Get enemy reference from sprite
        const enemy = enemySprite.enemyRef;
        if (!enemy) {
            return;
        }

        // Deal damage to enemy
        const scoreEarned = enemy.takeDamage(weapon.damage);

        // Destroy weapon
        weapon.destroy();

        // Add score if enemy was destroyed (takeDamage returns score when destroyed)
        if (scoreEarned) {
            this.scene.addScore(scoreEarned);
        }

        // Create hit effect
        this.createHitEffect(weapon.x, weapon.y);
    }

    createHitEffect(x, y) {
        if (this.scene.particleManager) {
            this.scene.particleManager.spearHit(x, y);
            return;
        }
        // Fallback: simple tween circle (no ParticleManager yet)
        const effect = this.scene.add.graphics();
        effect.fillStyle(0xffff00);
        effect.fillCircle(x, y, 10);
        this.scene.tweens.add({
            targets: effect,
            alpha: 0,
            scaleX: 2,
            scaleY: 2,
            duration: 200,
            onComplete: () => effect.destroy(),
        });
    }

    setWeaponType(weaponType) {
        if (this.weaponTypes[weaponType]) {
            this.currentWeaponType = weaponType;
        }
    }

    getCurrentWeaponType() {
        return this.currentWeaponType;
    }

    getWeaponsGroup() {
        return this.weapons;
    }

    getAvailableWeapons() {
        return Object.keys(this.weaponTypes);
    }
}

export default WeaponManager;
