/**
 * SpineBoneReader - Extracts bone transformation data from Spine JSON
 * This allows us to use Spine bone positions without the full Spine runtime
 */
class SpineBoneReader {
    constructor(spineJsonData) {
        this.data = spineJsonData;
        this.bones = {};
        this.animations = {};

        this.parseBones();
        this.parseAnimations();
    }

    parseBones() {
        if (!this.data || !this.data.bones) return;

        // Build bone hierarchy
        this.data.bones.forEach((bone) => {
            this.bones[bone.name] = {
                name: bone.name,
                parent: bone.parent || null,
                x: bone.x || 0,
                y: bone.y || 0,
                rotation: bone.rotation || 0,
                scaleX: bone.scaleX || 1,
                scaleY: bone.scaleY || 1,
                length: bone.length || 0,
            };
        });
    }

    parseAnimations() {
        if (!this.data || !this.data.animations) return;

        // Store animation data
        Object.keys(this.data.animations).forEach((animName) => {
            const animData = this.data.animations[animName];
            this.animations[animName] = {
                bones: animData.bones || {},
            };
        });
    }

    /**
     * Get bone world position for a specific animation and time
     * @param {string} boneName - Name of the bone (e.g., 'Handl')
     * @param {string} animationName - Animation name (e.g., 'Idle', 'Attack1')
     * @param {number} time - Time in animation (0 to duration)
     * @returns {object} {x, y, rotation} in world space
     */
    getBoneTransform(boneName, animationName = null, time = 0) {
        const bone = this.bones[boneName];
        if (!bone) {
            console.warn(`[SpineBoneReader] Bone '${boneName}' not found`);
            return { x: 0, y: 0, rotation: 0 };
        }

        // Start with base bone transform
        let transform = {
            x: bone.x,
            y: bone.y,
            rotation: bone.rotation,
        };

        // Apply animation transforms if specified
        if (animationName && this.animations[animationName]) {
            const animBoneData = this.animations[animationName].bones[boneName];
            if (animBoneData) {
                // Interpolate translation based on time
                if (animBoneData.translate && animBoneData.translate.length > 0) {
                    const translateValue = this.interpolateKeyframes(animBoneData.translate, time);
                    transform.x += translateValue.x || 0;
                    transform.y += translateValue.y || 0;
                }
                // Interpolate rotation based on time
                if (animBoneData.rotate && animBoneData.rotate.length > 0) {
                    const rotateValue = this.interpolateKeyframes(animBoneData.rotate, time);
                    transform.rotation += rotateValue.value || 0;
                }
                // Interpolate scale if present
                if (animBoneData.scale && animBoneData.scale.length > 0) {
                    const scaleValue = this.interpolateKeyframes(animBoneData.scale, time);
                    transform.scaleX = (transform.scaleX || 1) * (scaleValue.x || 1);
                    transform.scaleY = (transform.scaleY || 1) * (scaleValue.y || 1);
                }
                // Apply shear if present
                if (animBoneData.shear && animBoneData.shear.length > 0) {
                    const shearValue = this.interpolateKeyframes(animBoneData.shear, time);
                    // Shear affects rotation slightly
                    transform.rotation += shearValue.y || 0;
                }
            }
        }

        // Apply parent transforms (recursive)
        if (bone.parent) {
            const parentTransform = this.getBoneTransform(bone.parent, animationName, time);

            // Convert to world space
            const rad = (parentTransform.rotation * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            const worldX = parentTransform.x + (transform.x * cos - transform.y * sin);
            const worldY = parentTransform.y + (transform.x * sin + transform.y * cos);

            return {
                x: worldX,
                y: worldY,
                rotation: parentTransform.rotation + transform.rotation,
            };
        }

        return transform;
    }

    /**
     * Interpolate between keyframes based on time
     * @param {Array} keyframes - Array of keyframe objects
     * @param {number} time - Current time in animation
     * @returns {object} Interpolated values
     */
    interpolateKeyframes(keyframes, time) {
        if (!keyframes || keyframes.length === 0) {
            return { x: 0, y: 0, value: 0 };
        }

        // If only one keyframe, return it
        if (keyframes.length === 1) {
            return keyframes[0];
        }

        // Find the two keyframes to interpolate between
        let prevFrame = keyframes[0];
        let nextFrame = keyframes[keyframes.length - 1];

        for (let i = 0; i < keyframes.length - 1; i++) {
            const current = keyframes[i];
            const next = keyframes[i + 1];
            const currentTime = current.time || 0;
            const nextTime = next.time || 0;

            if (time >= currentTime && time <= nextTime) {
                prevFrame = current;
                nextFrame = next;
                break;
            }
        }

        // Simple linear interpolation
        const prevTime = prevFrame.time || 0;
        const nextTime = nextFrame.time || 0;
        const duration = nextTime - prevTime;

        if (duration === 0) {
            return prevFrame;
        }

        const t = (time - prevTime) / duration;

        // Interpolate values
        return {
            x: this.lerp(prevFrame.x || 0, nextFrame.x || 0, t),
            y: this.lerp(prevFrame.y || 0, nextFrame.y || 0, t),
            value: this.lerp(prevFrame.value || 0, nextFrame.value || 0, t),
        };
    }

    /**
     * Linear interpolation
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    }

    /**
     * Get simplified bone offset for common animations
     * @param {string} boneName
     * @param {string} state - 'idle', 'attack', 'run', etc.
     * @returns {object} {x, y, rotation}
     */
    getBoneOffset(boneName, state = 'idle') {
        // Map game states to Spine animation names
        const animMap = {
            idle: 'Idle',
            attack: 'Attack1',
            run: 'Run',
            jump: 'Jump',
        };

        const animName = animMap[state] || 'Idle';
        return this.getBoneTransform(boneName, animName, 0);
    }
}

export default SpineBoneReader;
