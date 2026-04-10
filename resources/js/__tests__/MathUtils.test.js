import { MathUtils } from '../utils/GameUtils.js';

describe('MathUtils', () => {
    it('should calculate distance between two points', () => {
        const p1 = { x: 0, y: 0 };
        const p2 = { x: 3, y: 4 };
        const dist = MathUtils.distance(p1, p2);
        expect(dist).toBe(5);
    });
});
