import { EnemyManager } from '../managers/EnemyManager.js';

function makeMockScene(scrollX = 0, playerX = 400) {
    return {
        cameras: { main: { scrollX, width: 800, height: 600 } },
        player: { sprite: { x: playerX } },
        entityFactory: { createEnemy: jest.fn() },
        gameUI: { getScore: jest.fn(() => 0) },
    };
}

describe('EnemyManager', () => {
    it('should construct with a scene', () => {
        const mockScene = makeMockScene();
        const manager = new EnemyManager(mockScene);
        expect(manager.scene).toBe(mockScene);
    });

    it('should select an enemy type', () => {
        const mockScene = makeMockScene();
        const manager = new EnemyManager(mockScene);
        const type = manager.selectEnemyType();
        expect(['zombie', 'skeleton', 'ghost']).toContain(type);
    });

    describe('calculateSpawnPosition', () => {
        it('respects setSpawnBounds — never spawns outside the set range', () => {
            const manager = new EnemyManager(makeMockScene(0, -9999)); // player far away
            manager.setSpawnBounds(100, 400);

            for (let i = 0; i < 100; i++) {
                const { x } = manager.calculateSpawnPosition();
                expect(x).toBeGreaterThanOrEqual(100);
                expect(x).toBeLessThanOrEqual(400);
            }
        });

        it('clears spawn bounds — spawns across full world when cleared', () => {
            const manager = new EnemyManager(makeMockScene(0, -9999));
            manager.setSpawnBounds(100, 200);
            manager.clearSpawnBounds();

            const xs = Array.from({ length: 50 }, () => manager.calculateSpawnPosition().x);
            // With no bounds, the range is 64..3136; at least some should exceed 200
            expect(xs.some(x => x > 200)).toBe(true);
        });

        it('never spawns within 250px of the player', () => {
            // Camera at scrollX=1200, player at 1600.
            // Fallback edges: max(32,1120)=1120 and min(3168,2080)=2080.
            // Both are ≥480px from player — well clear of the 250px guard.
            const manager = new EnemyManager(makeMockScene(1200, 1600));

            for (let i = 0; i < 50; i++) {
                const { x } = manager.calculateSpawnPosition();
                expect(Math.abs(x - 1600)).toBeGreaterThanOrEqual(250);
            }
        });

        it('returns x within world bounds (32 – 3168)', () => {
            const manager = new EnemyManager(makeMockScene(1000, 1400));

            for (let i = 0; i < 50; i++) {
                const { x } = manager.calculateSpawnPosition();
                expect(x).toBeGreaterThanOrEqual(32);
                expect(x).toBeLessThanOrEqual(3168);
            }
        });

        it('can produce world-wide x positions distributed across the level', () => {
            // Camera at far-right end — the left half of the world is off-screen and
            // safe to land in via the world-spawn path.
            const manager = new EnemyManager(makeMockScene(2400, 2800));
            const xs = Array.from({ length: 200 }, () => manager.calculateSpawnPosition().x);
            // Over 200 attempts, at least some should land in the first quarter (<800)
            expect(xs.some((x) => x < 800)).toBe(true);
        });
    });
});
