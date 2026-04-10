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
        it('never spawns inside a pit zone', () => {
            const manager = new EnemyManager(makeMockScene());
            const pitZones = [[896, 1088], [1728, 1920], [2304, 2496], [2752, 2880]];

            for (let i = 0; i < 100; i++) {
                const { x } = manager.calculateSpawnPosition();
                const inPit = pitZones.some(([s, e]) => x > s && x < e);
                expect(inPit).toBe(false);
            }
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
