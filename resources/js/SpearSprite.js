/* global Phaser */

/**
 * SpearSprite — visual attachment for a thrown spear projectile.
 *
 * Placed at the player's hand on creation (based on facing direction),
 * then tracks the weapon's world position and rotation every frame.
 * The weapon's own physics sprite is hidden so SpearSprite is the
 * sole visual for the projectile.
 */

const HAND_OFFSET_X = 20; // pixels to the side of the player hand (mirrored when facing left)
const HAND_OFFSET_Y = -48; // pixels above the foot anchor (~mid-torso on a 96px-tall player)

class SpearSprite {
    constructor(scene, player) {
        this.scene = scene;

        // Place the image at the player's throwing hand on launch
        const facing = player.sprite.flipX ? -1 : 1;
        const x = player.sprite.x + HAND_OFFSET_X * facing;
        const y = player.sprite.y + HAND_OFFSET_Y;

        this.image = scene.add.image(x, y, 'noteleks-frames', 'spear');
        this.image.setScale(0.15);
        this.image.setDepth(99);
        this.image.setFlipX(player.sprite.flipX);
    }

    /**
     * Reposition and re-orient the spear image to match the flying weapon.
     * @param {Phaser.GameObjects.Sprite} weapon  The active physics projectile.
     */
    update(weapon) {
        if (!this.image || !weapon) return;
        this.image.setPosition(weapon.x, weapon.y);
        this.image.setRotation(weapon.rotation ?? 0);
    }

    /**
     * Remove the spear image from the scene.
     */
    destroy() {
        if (this.image) {
            this.image.destroy();
            this.image = null;
        }
    }
}

export default SpearSprite;
