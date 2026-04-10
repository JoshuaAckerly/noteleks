/**
 * GameScene unit tests
 *
 * GameScene extends Phaser.Scene, so we set global.Phaser before importing
 * the module (matching the pattern in NoteleksGameModular.test.js).
 *
 * Individual methods are tested by constructing plain objects via
 * Object.create(GameScene.prototype) – this bypasses the Phaser/ECS
 * constructor while exercising the real method code.
 */
let GameScene;

beforeAll(async () => {
    global.Phaser = { Scene: class {} };
    ({ default: GameScene } = await import('../scenes/GameScene.js'));
});

// ── handleGameplayUpdate – pit-death ─────────────────────────────────────────

describe('handleGameplayUpdate – player pit-death', () => {
    function makeScene(playerY) {
        const scene = Object.create(GameScene.prototype);
        scene.gameOver = jest.fn();
        scene.updateParallax = jest.fn();
        scene.inputManager = null;
        scene.systemManager = null;
        scene.player = { sprite: { y: playerY }, update: jest.fn() };
        scene.enemyManager = null;
        return scene;
    }

    it('calls gameOver() when player falls below worldH + 50', () => {
        const scene = makeScene(700); // worldH=600, threshold=650
        scene.handleGameplayUpdate();
        expect(scene.gameOver).toHaveBeenCalled();
    });

    it('does NOT call gameOver() when player is within world bounds', () => {
        const scene = makeScene(400);
        scene.handleGameplayUpdate();
        expect(scene.gameOver).not.toHaveBeenCalled();
    });

    it('does NOT call gameOver() when player y is exactly at worldH + 50', () => {
        const scene = makeScene(650); // not strictly greater than threshold
        scene.handleGameplayUpdate();
        expect(scene.gameOver).not.toHaveBeenCalled();
    });
});

// ── handleGameplayUpdate – enemy pit-death ───────────────────────────────────

describe('handleGameplayUpdate – enemy pit-death', () => {
    it('calls takeDamage(9999) and removeEnemy for enemy below worldH + 50', () => {
        const scene = Object.create(GameScene.prototype);
        scene.gameOver = jest.fn();
        scene.updateParallax = jest.fn();
        scene.inputManager = null;
        scene.systemManager = null;
        scene.player = { sprite: { y: 300 }, update: jest.fn() };
        scene.addScore = jest.fn();

        const mockEnemy = { takeDamage: jest.fn(() => 10) };
        scene.enemyManager = {
            removeEnemy: jest.fn(),
            enemies: {
                children: {
                    entries: [{ y: 700, enemyRef: mockEnemy }],
                },
            },
            update: jest.fn(),
        };

        scene.handleGameplayUpdate();

        expect(mockEnemy.takeDamage).toHaveBeenCalledWith(9999);
        expect(scene.enemyManager.removeEnemy).toHaveBeenCalledWith(mockEnemy);
    });

    it('does not kill enemies within world bounds', () => {
        const scene = Object.create(GameScene.prototype);
        scene.gameOver = jest.fn();
        scene.updateParallax = jest.fn();
        scene.inputManager = null;
        scene.systemManager = null;
        scene.player = { sprite: { y: 300 }, update: jest.fn() };
        scene.addScore = jest.fn();

        const mockEnemy = { takeDamage: jest.fn(() => 10) };
        scene.enemyManager = {
            removeEnemy: jest.fn(),
            enemies: {
                children: {
                    entries: [{ y: 400, enemyRef: mockEnemy }], // well within world
                },
            },
            update: jest.fn(),
        };

        scene.handleGameplayUpdate();

        expect(mockEnemy.takeDamage).not.toHaveBeenCalled();
        expect(scene.enemyManager.removeEnemy).not.toHaveBeenCalled();
    });
});

// ── updateParallax ────────────────────────────────────────────────────────────

describe('updateParallax', () => {
    function makeParallaxScene(scrollX = 400) {
        const scene = Object.create(GameScene.prototype);
        scene._parallaxReady = true;
        scene.cameras = { main: { scrollX } };
        scene.bgFar = { tilePositionX: 0 };
        scene.bgMid = { tilePositionX: 0 };
        return scene;
    }

    it('sets bgFar.tilePositionX to scrollX × 0.15', () => {
        const scene = makeParallaxScene(400);
        scene.updateParallax();
        expect(scene.bgFar.tilePositionX).toBeCloseTo(400 * 0.15);
    });

    it('sets bgMid.tilePositionX to scrollX × 0.4', () => {
        const scene = makeParallaxScene(400);
        scene.updateParallax();
        expect(scene.bgMid.tilePositionX).toBeCloseTo(400 * 0.4);
    });

    it('does nothing when _parallaxReady is false', () => {
        const scene = makeParallaxScene(400);
        scene._parallaxReady = false;
        scene.updateParallax();
        expect(scene.bgFar.tilePositionX).toBe(0);
        expect(scene.bgMid.tilePositionX).toBe(0);
    });

    it('updates correctly at scrollX = 0', () => {
        const scene = makeParallaxScene(0);
        scene.updateParallax();
        expect(scene.bgFar.tilePositionX).toBe(0);
        expect(scene.bgMid.tilePositionX).toBe(0);
    });
});

// ── setupCamera ───────────────────────────────────────────────────────────────

describe('setupCamera', () => {
    it('calls startFollow with player sprite and lerp 0.08', () => {
        const scene = Object.create(GameScene.prototype);
        const mockStartFollow = jest.fn();
        scene.cameras = {
            main: {
                setBounds: jest.fn(),
                startFollow: mockStartFollow,
            },
        };
        const mockSprite = {};
        scene.player = { sprite: mockSprite };

        scene.setupCamera();

        expect(mockStartFollow).toHaveBeenCalledWith(mockSprite, true, 0.08, 0.08);
    });

    it('sets camera bounds to world dimensions (3200 × 600)', () => {
        const scene = Object.create(GameScene.prototype);
        const mockSetBounds = jest.fn();
        scene.cameras = {
            main: {
                setBounds: mockSetBounds,
                startFollow: jest.fn(),
            },
        };
        scene.player = { sprite: {} };

        scene.setupCamera();

        expect(mockSetBounds).toHaveBeenCalledWith(0, 0, 3200, 600);
    });

    it('does nothing when player has no sprite', () => {
        const scene = Object.create(GameScene.prototype);
        const mockStartFollow = jest.fn();
        scene.cameras = { main: { startFollow: mockStartFollow, setBounds: jest.fn() } };
        scene.player = {}; // no .sprite

        scene.setupCamera(); // must not throw

        expect(mockStartFollow).not.toHaveBeenCalled();
    });

    it('does nothing when player is null', () => {
        const scene = Object.create(GameScene.prototype);
        const mockStartFollow = jest.fn();
        scene.cameras = { main: { startFollow: mockStartFollow, setBounds: jest.fn() } };
        scene.player = null;

        scene.setupCamera();

        expect(mockStartFollow).not.toHaveBeenCalled();
    });
});
