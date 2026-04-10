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
        it('creates 18 floating platforms (one per floater definition)', () => {
            const mockScene = createMockScene();
            const manager = new PlatformManager(mockScene);
            manager.platforms = { add: jest.fn() };

            const floatSpy = jest.spyOn(manager, 'createFloatingPlatform');
            manager.createPlatforms();

            expect(floatSpy).toHaveBeenCalledTimes(18);
        });

        it('does not place ground tiles at x=928 (inside pit zone 1: 896–1088)', () => {
            const mockScene = createMockScene();
            const manager = new PlatformManager(mockScene);
            manager.platforms = { add: jest.fn() };
            manager.createPlatforms();

            const groundCalls = mockScene.entityFactory.createPlatform.mock.calls
                .filter(([, , type]) => type === 'ground');
            const xValues = groundCalls.map(([x]) => x);

            expect(xValues).not.toContain(928);   // 928 is inside [896, 1088]
            expect(xValues).not.toContain(992);   // also inside pit 1
        });

        it('does not place ground tiles inside pit zone 2 (1728–1920)', () => {
            const mockScene = createMockScene();
            const manager = new PlatformManager(mockScene);
            manager.platforms = { add: jest.fn() };
            manager.createPlatforms();

            const groundCalls = mockScene.entityFactory.createPlatform.mock.calls
                .filter(([, , type]) => type === 'ground');
            const xValues = groundCalls.map(([x]) => x);

            expect(xValues).not.toContain(1760);  // inside [1728, 1920]
            expect(xValues).not.toContain(1824);
        });

        it('does not place ground tiles inside pit zones 3 and 4', () => {
            const mockScene = createMockScene();
            const manager = new PlatformManager(mockScene);
            manager.platforms = { add: jest.fn() };
            manager.createPlatforms();

            const groundCalls = mockScene.entityFactory.createPlatform.mock.calls
                .filter(([, , type]) => type === 'ground');
            const xValues = groundCalls.map(([x]) => x);

            expect(xValues).not.toContain(2336);  // inside [2304, 2496]
            expect(xValues).not.toContain(2784);  // inside [2752, 2880]
        });

        it('does place ground tiles just outside pit zone boundaries', () => {
            const mockScene = createMockScene();
            const manager = new PlatformManager(mockScene);
            manager.platforms = { add: jest.fn() };
            manager.createPlatforms();

            const groundCalls = mockScene.entityFactory.createPlatform.mock.calls
                .filter(([, , type]) => type === 'ground');
            const xValues = groundCalls.map(([x]) => x);

            // tileX=864 (i=13) is just before pit 1 (896) — should be present
            expect(xValues).toContain(864);
            // tileX=1120 (i=17) is just after pit 1 (1088) — should be present
            expect(xValues).toContain(1120);
        });

        it('floating platforms span the full 3200px world', () => {
            const mockScene = createMockScene();
            const manager = new PlatformManager(mockScene);
            manager.platforms = { add: jest.fn() };

            const floatSpy = jest.spyOn(manager, 'createFloatingPlatform');
            manager.createPlatforms();

            const xValues = floatSpy.mock.calls.map(([x]) => x);
            // Earliest platform is in the tutorial zone (x < 800)
            expect(Math.min(...xValues)).toBeLessThan(800);
            // Latest platform reaches into the advanced zone (x > 2400)
            expect(Math.max(...xValues)).toBeGreaterThan(2400);
        });
    });
});
