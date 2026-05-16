import { PlatformManager } from '../managers/PlatformManager.js';
import { GameConfig } from '../config/GameConfig.js';

function createMockScene() {
    return {
        cameras: { main: { width: 800, height: 600 } },
        entityFactory: { createPlatform: jest.fn(() => ({ x: 0, y: 0 })) },
        physics: { add: { staticGroup: jest.fn(() => ({ add: jest.fn() })) } },
    };
}

describe('PlatformManager', () => {
    it('should construct with a scene', () => {
        const mockScene = createMockScene();
        const manager = new PlatformManager(mockScene);
        expect(manager.scene).toBe(mockScene);
    });

    it('should create ground platforms', () => {
        const mockScene = createMockScene();
        const manager = new PlatformManager(mockScene);
        manager.platforms = { add: jest.fn() };
        manager.createPlatforms();
        expect(mockScene.entityFactory.createPlatform).toHaveBeenCalled();
    });

    describe('createPlatforms – world layout', () => {
        it('creates multiple floating platforms (procedural: 12–30)', () => {
            const mockScene = createMockScene();
            const manager = new PlatformManager(mockScene);
            manager.platforms = { add: jest.fn() };

            const floatSpy = jest.spyOn(manager, 'createFloatingPlatform');
            manager.createPlatforms();

            expect(floatSpy.mock.calls.length).toBeGreaterThanOrEqual(12);
            expect(floatSpy.mock.calls.length).toBeLessThanOrEqual(30);
        });

        it('always skips some ground tiles (at least one pit exists)', () => {
            const mockScene = createMockScene();
            const manager = new PlatformManager(mockScene);
            manager.platforms = { add: jest.fn() };
            manager.createPlatforms();

            const groundCalls = mockScene.entityFactory.createPlatform.mock.calls
                .filter(([, , type]) => type === 'ground');
            const groundCount = groundCalls.length;
            // With no pits the world needs ~50 tiles; pits always remove at least 2+
            const worldW = GameConfig.world?.width ?? 3200;
            const tileW  = GameConfig.assets.textures.ground.width ?? 64;
            const maxTiles = Math.ceil(worldW / tileW) + 1;
            expect(groundCount).toBeLessThan(maxTiles);
        });

        it('ground tiles only land on valid pit-zone types', () => {
            const mockScene = createMockScene();
            const manager = new PlatformManager(mockScene);
            manager.platforms = { add: jest.fn() };
            manager.createPlatforms();

            const groundCalls = mockScene.entityFactory.createPlatform.mock.calls
                .filter(([, , type]) => type === 'ground');

            // Every ground tile x should be a multiple of tileW offset (tile grid alignment)
            const tileW = GameConfig.assets.textures.ground.width ?? 64;
            groundCalls.forEach(([x]) => {
                // tileX = i*tileW + tileW/2, so (x - tileW/2) % tileW === 0
                expect((x - tileW / 2) % tileW).toBe(0);
            });
        });

        it('generates different layouts on separate calls', () => {
            // Run twice and compare floating platform x-values
            const mockScene1 = createMockScene();
            const mgr1 = new PlatformManager(mockScene1);
            mgr1.platforms = { add: jest.fn() };
            const spy1 = jest.spyOn(mgr1, 'createFloatingPlatform');
            mgr1.createPlatforms();
            const xs1 = spy1.mock.calls.map(([x]) => Math.round(x));

            const mockScene2 = createMockScene();
            const mgr2 = new PlatformManager(mockScene2);
            mgr2.platforms = { add: jest.fn() };
            const spy2 = jest.spyOn(mgr2, 'createFloatingPlatform');
            mgr2.createPlatforms();
            const xs2 = spy2.mock.calls.map(([x]) => Math.round(x));

            // With random placement the exact platform lists will almost never match.
            // (If this flakes, the RNG is broken — not the game code.)
            const identical = JSON.stringify(xs1) === JSON.stringify(xs2);
            expect(identical).toBe(false);
        });

        it('floating platforms span the full 3200px world', () => {
            const mockScene = createMockScene();
            const manager = new PlatformManager(mockScene);
            manager.platforms = { add: jest.fn() };

            const floatSpy = jest.spyOn(manager, 'createFloatingPlatform');
            manager.createPlatforms();

            const xValues = floatSpy.mock.calls.map(([x]) => x);
            // Zone 0 platforms start at x≥280, which is < 800
            expect(Math.min(...xValues)).toBeLessThan(800);
            // Zone 3 platforms reach up to ~2840, which is > 2400
            expect(Math.max(...xValues)).toBeGreaterThan(2400);
        });
    });
});
