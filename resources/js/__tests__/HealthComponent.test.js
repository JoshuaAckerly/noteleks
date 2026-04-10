import HealthComponent from '../components/HealthComponent.js';

describe('HealthComponent', () => {
    function createMockGameObject() {
        return {
            sprite: {
                setTint: jest.fn(),
                setAlpha: jest.fn(),
                setFillStyle: jest.fn(),
            },
            scene: {
                time: { delayedCall: jest.fn((_, cb) => cb && cb()) },
            },
        };
    }

    it('should initialize with max health', () => {
        const comp = new HealthComponent(100);
        comp.gameObject = createMockGameObject();
        expect(comp.maxHealth).toBe(100);
        expect(comp.currentHealth).toBe(100);
    });

    it('should take damage and reduce health', () => {
        const comp = new HealthComponent(100);
        comp.gameObject = createMockGameObject();
        comp.takeDamage(30);
        expect(comp.currentHealth).toBe(70);
    });

    it('should not go below zero health', () => {
        const comp = new HealthComponent(50);
        comp.gameObject = createMockGameObject();
        comp.takeDamage(100);
        expect(comp.currentHealth).toBeGreaterThanOrEqual(0);
    });
});
