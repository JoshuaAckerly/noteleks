/**
 * ParticleManager — centralises all particle effects for the Noteleks game.
 *
 * Uses Phaser 3.60+ ParticleEmitter API (scene.add.particles returns emitter directly).
 * Texture is created via a native HTML canvas element so it works regardless of
 * the Phaser renderer mode or construction timing.
 *
 * Effects:
 *   spearHit(x, y)              — yellow/orange sparks on weapon impact
 *   enemyDeath(x, y, color)     — coloured burst matching the enemy type
 *   playerDamage(x, y)          — red particles when the player is hit
 *   landing(x, y)               — small dust puff when the player touches down
 *   startPlayerAura(sprite)     — continuous green glow trailing the player
 *   stopPlayerAura()            — stops the green aura
 *   updatePlayerAura()          — call every frame; emits at chest in world space
 *   setAuraHealth(current, max) — drives aura size/brightness from health ratio
 */
class ParticleManager {
    /** @param {Phaser.Scene} scene */
    constructor(scene) {
        this.scene = scene;
        this._textureKey = 'noteleks-particle';

        // Emitter references (null-guarded in all public methods)
        this._hitEmitter       = null;
        this._damageEmitter    = null;
        this._landingEmitter   = null;
        this._auraHighEmitter  = null; // full health   (hp > 66 %)
        this._auraMidEmitter   = null; // medium health (33–66 %)
        this._auraLowEmitter   = null; // low health    (0–33 %)

        // Aura state
        this._auraSprite   = null;
        this._auraActive   = false;
        this._auraLastEmit = 0;
        this._auraInterval = 45;  // ms between bursts
        this._auraHealth   = 1.0; // 0–1, set via setAuraHealth()

        try { this._createTexture(); } catch { /* ignore — particles will be invisible but won't crash */ }
        try { this._buildEmitters(); } catch { /* ignore */ }
    }

    // ─── Internal setup ───────────────────────────────────────────────────────

    /**
     * Build texture using a native HTML5 canvas so it works in any renderer
     * mode and at any point in the Phaser lifecycle.
     */
    _createTexture() {
        if (this.scene.textures.exists(this._textureKey)) return;
        const canvas = document.createElement('canvas');
        canvas.width  = 8;
        canvas.height = 8;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(4, 4, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        this.scene.textures.addCanvas(this._textureKey, canvas);
    }

    _buildEmitters() {
        const k = this._textureKey;

        // Spear / weapon impact — bright yellow-orange sparks with gravity
        this._hitEmitter = this.scene.add.particles(0, 0, k, {
            speed:    { min: 80, max: 240 },
            angle:    { min: 0,  max: 360 },
            scale:    { start: 0.7, end: 0 },
            lifespan: 320,
            gravityY: 350,
            tint:     [0xffff00, 0xff8800, 0xffffff],
            emitting: false,
        });
        this._hitEmitter.setDepth(600);

        // Player damage — red burst
        this._damageEmitter = this.scene.add.particles(0, 0, k, {
            speed:    { min: 40, max: 130 },
            angle:    { min: 0,  max: 360 },
            scale:    { start: 0.9, end: 0 },
            lifespan: 300,
            gravityY: 200,
            tint:     0xff2222,
            emitting: false,
        });
        this._damageEmitter.setDepth(600);

        // Landing dust — low flat fan
        this._landingEmitter = this.scene.add.particles(0, 0, k, {
            speed:    { min: 15, max: 60 },
            angle:    { min: 155, max: 205 },
            scale:    { start: 0.5, end: 0 },
            lifespan: 250,
            gravityY: -30,
            tint:     0xaa9966,
            emitting: false,
        });
        this._landingEmitter.setDepth(600);

        // Three pre-configured aura emitters — avoids dynamic property mutation
        // (setParticleProperty / setScale / setTint vary by Phaser minor version)
        const auraBase = {
            x:        { min: -10, max: 10 },
            y:        { min: -10, max: 10 },
            speedX:   { min: -35, max: 35 },
            speedY:   { min: -20, max: 5 },
            gravityY: -55,
            lifespan: { min: 500, max: 900 },
            emitting: false,
        };

        this._auraHighEmitter = this.scene.add.particles(0, 0, k, {
            ...auraBase,
            scale: { start: 0.75, end: 0 },
            tint:  0x00cc33,  // bright green
        });
        this._auraHighEmitter.setDepth(99);

        this._auraMidEmitter = this.scene.add.particles(0, 0, k, {
            ...auraBase,
            scale: { start: 0.48, end: 0 },
            tint:  0x007722,  // mid green
        });
        this._auraMidEmitter.setDepth(99);

        this._auraLowEmitter = this.scene.add.particles(0, 0, k, {
            ...auraBase,
            scale: { start: 0.25, end: 0 },
            tint:  0x003310,  // dark green
        });
        this._auraLowEmitter.setDepth(99);
    }

    // ─── Public API ───────────────────────────────────────────────────────────

    /** Sparks where a spear (or other weapon) connects. */
    spearHit(x, y) {
        this._hitEmitter?.explode(15, x, y);
    }

    /**
     * Coloured burst when an enemy dies.
     * Creates a fresh one-shot emitter per call (enemy deaths are infrequent).
     */
    enemyDeath(x, y, color = 0xff4444) {
        try {
            const emitter = this.scene.add.particles(x, y, this._textureKey, {
                speed:    { min: 50, max: 180 },
                angle:    { min: 0,  max: 360 },
                scale:    { start: 1.0, end: 0 },
                lifespan: 500,
                gravityY: 200,
                tint:     color,
                emitting: false,
            });
            emitter.setDepth(600);
            emitter.explode(20, x, y);
            this.scene.time.delayedCall(650, () => {
                if (emitter && emitter.scene) emitter.destroy();
            });
        } catch { /* ignore */ }
    }

    /** Red particles when the player takes a hit. */
    playerDamage(x, y) {
        this._damageEmitter?.explode(10, x, y);
    }

    /** Dust puff when the player lands after a jump. */
    landing(x, y) {
        this._landingEmitter?.explode(8, x, y);
    }

    /**
     * Update the health ratio that drives aura intensity.
     * @param {number} current   Current health value.
     * @param {number} max       Maximum health value.
     */
    setAuraHealth(current, max) {
        this._auraHealth = max > 0 ? Math.max(0, Math.min(1, current / max)) : 0;
    }

    /**
     * Start the continuous green aura around the player.
     * @param {Phaser.GameObjects.Sprite} sprite  The player's physics sprite.
     */
    startPlayerAura(sprite) {
        if (!sprite) return;
        this._auraSprite   = sprite;
        this._auraActive   = true;
        this._auraLastEmit = 0;
    }

    /** Stop the green aura (e.g. on game over). */
    stopPlayerAura() {
        this._auraActive = false;
        this._auraSprite = null;
    }

    /**
     * Call every frame.
     * Spawns particles at the player's chest in world space every _auraInterval ms.
     * Picks the appropriate pre-configured emitter based on _auraHealth:
     *   hp > 66%  → bright, large  (3 particles/burst)
     *   hp > 33%  → mid tone       (2 particles/burst)
     *   hp ≤ 33%  → dark, small    (1 particle/burst)
     */
    updatePlayerAura() {
        if (!this._auraActive || !this._auraSprite) return;
        const now = this.scene.time.now;
        if (now - this._auraLastEmit < this._auraInterval) return;
        this._auraLastEmit = now;

        const hp = this._auraHealth;
        let emitter, count;
        if (hp > 0.66) {
            emitter = this._auraHighEmitter;
            count   = 3;
        } else if (hp > 0.33) {
            emitter = this._auraMidEmitter;
            count   = 2;
        } else {
            emitter = this._auraLowEmitter;
            count   = 1;
        }

        const chestX = this._auraSprite.x;
        const chestY = this._auraSprite.y - (this._auraSprite.displayHeight ?? 0) * 0.7;
        emitter?.explode(count, chestX, chestY);
    }
}

export default ParticleManager;
