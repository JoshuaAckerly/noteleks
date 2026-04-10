import GameConfig from '../config/GameConfig.js';

const SPINE_ANIMATION_MAP = {
    'player-idle': 'Idle',
    'player-run': 'Run',
    'player-walk': 'Walk',
    'player-jump': 'Jump',
    'player-attack': 'Attack1',
    'player-jump-attack': 'JumpAttack',
};

/**
 * AnimationManager - Handles sprite animations
 */
class AnimationManager {
    constructor(sprite, scene, spineObject = null) {
        this.sprite = sprite;
        this.scene = scene;
        this.spineObject = spineObject;
        this.currentAnimation = null;
        this.setupAnimationListeners();
    }

    /**
     * Setup animation event listeners
     */
    setupAnimationListeners() {
        if (!this.sprite) return;

        // Listen for animation complete events
        this.sprite.on('animationcomplete', (animation) => {
            // When attack animation completes, return to idle
            if (animation.key === 'player-attack') {
                this.play('player-idle', true);
            }
        });
    }

    hasSpineRuntime() {
        return !!(GameConfig.useSpine && this.spineObject && this.spineObject.animationState);
    }

    /**
     * Play an animation on the sprite
     */
    play(animationKey, loop = true) {
        if (!this.sprite && !this.hasSpineRuntime()) return;

        // Allow attack animation to restart
        if (this.currentAnimation === animationKey && animationKey !== 'player-attack') return;

        if (this.hasSpineRuntime()) {
            const spineAnimation = SPINE_ANIMATION_MAP[animationKey];
            if (!spineAnimation) {
                console.warn('[AnimationManager] Spine animation not mapped:', animationKey);
                return;
            }

            try {
                this.spineObject.animationState.setAnimation(0, spineAnimation, loop);
                this.currentAnimation = animationKey;
                return;
            } catch (e) {
                console.warn('[AnimationManager] Failed to play spine animation:', animationKey, e.message);
            }
        }

        if (!this.sprite || !this.sprite.play) return;

        try {
            if (this.scene.anims.exists(animationKey)) {
                this.sprite.play(animationKey);
                this.currentAnimation = animationKey;
            } else {
                console.warn('[AnimationManager] Animation not found:', animationKey);
            }
        } catch (e) {
            console.warn('[AnimationManager] Failed to play animation:', animationKey, e.message);
        }
    }

    /**
     * Get current animation
     */
    getCurrentAnimation() {
        return this.currentAnimation;
    }

    /**
     * Check if animation is playing
     */
    isPlaying(animationKey) {
        return this.currentAnimation === animationKey;
    }
}

export default AnimationManager;
