import GameConfig from '../config/GameConfig.js';

const ROOM_WIDTH = 3200; // 4× the 800px viewport — wide room the camera scrolls through
const FADE_DURATION = 500;

/**
 * Manages room-based level progression.
 *
 * The world is divided into rooms (3200 × 800) — wider and taller than the 800×600
 * viewport so the camera scrolls in both directions as the player explores. Each room has its
 * own procedurally generated platform layout and enemy quota. Clearing all
 * enemies in a room triggers a camera-fade transition to the next room. When
 * the last room is cleared the round ends.
 *
 * Physics and camera bounds are locked to the active room so the player cannot
 * wander into uncleared rooms.
 */
export class RoomManager {
    constructor(scene) {
        this.scene = scene;

        /**
         * @type {Array<{
         *   index: number,
         *   x: number,
         *   width: number,
         *   cleared: boolean,
         *   enemyCount: number,
         *   spawnedCount: number
         * }>}
         */
        this.rooms = [];
        this.currentRoomIndex = 0;
        this.isTransitioning = false;
        this._roomLabel = null;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Set up rooms for a new round. Call before rebuilding platforms.
     * @param {number} numRooms
     * @param {number} round 1-based current round number
     */
    initialize(numRooms, round) {
        this._destroyLabel();
        this.rooms = [];
        this.currentRoomIndex = 0;
        this.isTransitioning = false;

        for (let i = 0; i < numRooms; i++) {
            this.rooms.push({
                index: i,
                x: i * ROOM_WIDTH,
                width: ROOM_WIDTH,
                cleared: false,
                enemyCount: this._enemyCount(i, round),
                spawnedCount: 0,
            });
        }

        // Sync config world width so platform/camera helpers read the right value
        GameConfig.world.width = numRooms * ROOM_WIDTH;

        this._applyRoomBounds(0);
    }

    getCurrentRoom() {
        return this.rooms[this.currentRoomIndex] ?? null;
    }

    getRoomCount() {
        return this.rooms.length;
    }

    hasNextRoom() {
        return this.currentRoomIndex < this.rooms.length - 1;
    }

    /**
     * Safe spawn X range for the current room (80 px inset on each side).
     * @returns {{ minX: number, maxX: number } | null}
     */
    getSpawnBounds() {
        const room = this.getCurrentRoom();
        if (!room) return null;
        return { minX: room.x + 80, maxX: room.x + room.width - 80 };
    }

    markCurrentRoomCleared() {
        const room = this.getCurrentRoom();
        if (room) room.cleared = true;
    }

    /**
     * Fade out → reposition player to next room start → update bounds → fade in
     * → call onComplete when the transition is fully done.
     * @param {function} onComplete
     */
    transitionToNextRoom(onComplete) {
        if (this.isTransitioning || !this.hasNextRoom()) return;
        this.isTransitioning = true;

        const cam = this.scene.cameras.main;
        cam.fadeOut(FADE_DURATION, 0, 0, 0);

        cam.once('camerafadeoutcomplete', () => {
            this.currentRoomIndex++;
            const room = this.getCurrentRoom();

            // Reposition player at the left side of the new room
            const spawnX = room.x + 80;
            const spawnY = (GameConfig.world?.height ?? 600) - 80;
            try {
                if (this.scene.player?.reset) {
                    this.scene.player.reset(spawnX, spawnY);
                } else if (this.scene.player?.sprite) {
                    this.scene.player.sprite.setPosition(spawnX, spawnY);
                    this.scene.player.sprite.body?.setVelocity(0, 0);
                }
            } catch { /* ignore */ }

            this._applyRoomBounds(this.currentRoomIndex);
            this._showRoomLabel(room.index + 1, this.rooms.length);

            cam.fadeIn(FADE_DURATION, 0, 0, 0);
            cam.once('camerafadeincomplete', () => {
                this.isTransitioning = false;
                if (onComplete) onComplete();
            });
        });
    }

    reset(numRooms, round) {
        this.initialize(numRooms, round);
    }

    shutdown() {
        this._destroyLabel();
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /** Enemies per room: later rooms and higher rounds spawn more. */
    _enemyCount(roomIndex, round) {
        return 2 + roomIndex + Math.floor((round - 1) / 2);
    }

    _applyRoomBounds(roomIndex) {
        const room = this.rooms[roomIndex];
        if (!room) return;

        const worldH = GameConfig.world?.height ?? 600;

        // Constrain physics world to this room so setCollideWorldBounds works
        try {
            this.scene.physics.world.setBounds(room.x, 0, room.width, worldH);
            // Keep bottom open so players/enemies fall into pits
            this.scene.physics.world.checkCollision.down = false;
        } catch { /* ignore */ }

        // Lock camera view to this room
        try {
            this.scene.cameras.main.setBounds(room.x, 0, room.width, worldH);
        } catch { /* ignore */ }
    }

    _showRoomLabel(roomNum, total) {
        this._destroyLabel();
        try {
            const sw = this.scene.scale.width;
            const sh = this.scene.scale.height;
            this._roomLabel = this.scene.add
                .text(sw / 2, sh / 2 - 40, `Room ${roomNum} / ${total}`, {
                    fontSize: '28px',
                    fill: '#ffffff',
                    fontFamily: 'Arial',
                    stroke: '#000000',
                    strokeThickness: 4,
                })
                .setOrigin(0.5)
                .setScrollFactor(0)
                .setDepth(500);

            this.scene.time.delayedCall(1400, () => this._destroyLabel());
        } catch { /* ignore */ }
    }

    _destroyLabel() {
        if (this._roomLabel) {
            try { this._roomLabel.destroy(); } catch { /* ignore */ }
            this._roomLabel = null;
        }
    }
}

export default RoomManager;
