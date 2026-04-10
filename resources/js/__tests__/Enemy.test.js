import Enemy from '../entities/Enemy.js';

/**
 * Create a minimal Enemy-like object via Object.create to bypass the full
 * ECS/Phaser constructor. This lets us unit-test Enemy.update() logic in
 * isolation — specifically the X-clamping and the intentional absence of
 * Y-clamping (so enemies fall into pits).
 */
function makeBareEnemy(scene, spriteOverrides = {}) {
    const enemy = Object.create(Enemy.prototype);
    enemy.scene = scene;
    enemy.type = 'zombie';
    enemy.isDestroyed = false;
    // GameObject requires a components Map for super.update()
    enemy.components = new Map();
    enemy.sprite = {
        body: { setVelocityX: jest.fn(), setVelocityY: jest.fn() },
        ...spriteOverrides,
    };
    return enemy;
}

function makeMockScene(gameState = 'playing') {
    return {
        gameState,
        physics: {
            world: {
                bounds: { x: 0, right: 3200, bottom: 600 },
            },
        },
        player: null,
    };
}

describe('Enemy', () => {
    describe('update() – boundary clamping', () => {
        it('clamps sprite.x to bounds.x when too far left', () => {
            const scene = makeMockScene();
            const enemy = makeBareEnemy(scene, { x: -20, y: 300 });
            Enemy.prototype.update.call(enemy, null);
            expect(enemy.sprite.x).toBe(0);
            expect(enemy.sprite.body.setVelocityX).toHaveBeenCalledWith(0);
        });

        it('clamps sprite.x to bounds.right when too far right', () => {
            const scene = makeMockScene();
            const enemy = makeBareEnemy(scene, { x: 3300, y: 300 });
            Enemy.prototype.update.call(enemy, null);
            expect(enemy.sprite.x).toBe(3200);
            expect(enemy.sprite.body.setVelocityX).toHaveBeenCalledWith(0);
        });

        it('does NOT clamp sprite.y when below world bottom (allows pit-death)', () => {
            const scene = makeMockScene();
            const enemy = makeBareEnemy(scene, { x: 500, y: 900 });
            Enemy.prototype.update.call(enemy, null);
            // y must remain unchanged so GameScene.handleGameplayUpdate can detect the fall
            expect(enemy.sprite.y).toBe(900);
        });

        it('does NOT clamp sprite.y when far above world (normal jump trajectory)', () => {
            const scene = makeMockScene();
            const enemy = makeBareEnemy(scene, { x: 500, y: -50 });
            Enemy.prototype.update.call(enemy, null);
            expect(enemy.sprite.y).toBe(-50);
        });

        it('leaves position unchanged when within world bounds', () => {
            const scene = makeMockScene();
            const enemy = makeBareEnemy(scene, { x: 800, y: 400 });
            Enemy.prototype.update.call(enemy, null);
            expect(enemy.sprite.x).toBe(800);
            expect(enemy.sprite.y).toBe(400);
        });

        it('returns early and skips clamping when gameState is not playing', () => {
            const scene = makeMockScene('paused');
            const enemy = makeBareEnemy(scene, { x: -50, y: 300 });
            Enemy.prototype.update.call(enemy, null);
            // x should NOT have been clamped since we returned early
            expect(enemy.sprite.x).toBe(-50);
        });
    });
});
