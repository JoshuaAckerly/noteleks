import { GameConfig } from '../config/GameConfig.js';

describe('GameConfig', () => {
    it('should have correct default player health', () => {
        expect(GameConfig.player.health).toBe(100);
        expect(GameConfig.player.maxHealth).toBe(100);
    });

    it('should have double jump enabled', () => {
        expect(GameConfig.player.doubleJumpEnabled).toBe(true);
    });

    it('should have correct world dimensions', () => {
        expect(GameConfig.world.width).toBe(3200);
        expect(GameConfig.world.height).toBe(600);
    });

    it('should have correct player start position', () => {
        expect(GameConfig.player.startPosition.x).toBe(200);
        expect(GameConfig.player.startPosition.y).toBe(400);
    });

    it('should have snappy physics gravity', () => {
        expect(GameConfig.physics.gravity.y).toBe(500);
    });

    it('should have coyoteTime and jumpBuffer configured', () => {
        expect(GameConfig.player.coyoteTime).toBe(100);
        expect(GameConfig.player.jumpBuffer).toBe(120);
    });

    it('should have improved player speed', () => {
        expect(GameConfig.player.speed).toBe(220);
    });
});
