/**
 * Math and Physics Utilities
 */
export class MathUtils {
    /**
     * Calculate distance between two points
     */
    static distance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Clamp a value between min and max
     */
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    /**
     * Linear interpolation
     */
    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    /**
     * Check if a point is within a rectangle
     */
    static pointInRect(point, rect) {
        return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
    }

    /**
     * Generate random position within bounds
     */
    static randomPosition(bounds) {
        return {
            x: Math.random() * (bounds.maxX - bounds.minX) + bounds.minX,
            y: Math.random() * (bounds.maxY - bounds.minY) + bounds.minY,
        };
    }
}

/**
 * Game State Utilities
 */
export class GameStateUtils {
    static STATES = {
        LOADING: 'loading',
        PLAYING: 'playing',
        PAUSED: 'paused',
        GAME_OVER: 'gameOver',
        MENU: 'menu',
    };

    static isPlayingState(state) {
        return state === this.STATES.PLAYING;
    }

    static isPausedState(state) {
        return state === this.STATES.PAUSED;
    }

    static isGameOverState(state) {
        return state === this.STATES.GAME_OVER;
    }
}

/**
 * Input Utilities
 */
export class InputUtils {
    static createControlScheme(scene) {
        return {
            cursors: scene.input.keyboard.createCursorKeys(),
            wasd: scene.input.keyboard.addKeys('W,S,A,D,P,R,ESC'),
            space: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
            mouse: scene.input.activePointer,
        };
    }

    static isMovingLeft(controls) {
        return controls.cursors.left.isDown || controls.wasd.A.isDown;
    }

    static isMovingRight(controls) {
        return controls.cursors.right.isDown || controls.wasd.D.isDown;
    }

    static isJumping(controls) {
        return controls.cursors.up.isDown || controls.wasd.W.isDown;
    }

    static isPausePressed(controls) {
        return Phaser.Input.Keyboard.JustDown(controls.wasd.P);
    }

    static isRestartPressed(controls) {
        return Phaser.Input.Keyboard.JustDown(controls.wasd.R);
    }
}

export default { MathUtils, GameStateUtils, InputUtils };
