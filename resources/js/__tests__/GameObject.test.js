import GameObject from '../core/GameObject';

describe('GameObject', () => {
    let gameObject;
    let mockScene;
    let mockSprite;

    beforeEach(() => {
        mockScene = {};
        mockSprite = { x: 0, y: 0, setPosition: jest.fn(), destroy: jest.fn() };
        gameObject = new GameObject(mockScene, 10, 20);
        gameObject.sprite = mockSprite;
    });

    it('initializes with correct properties', () => {
        expect(gameObject.scene).toBe(mockScene);
        expect(gameObject.x).toBe(10);
        expect(gameObject.y).toBe(20);
        expect(gameObject.isDestroyed).toBe(false);
        expect(gameObject.components.size).toBe(0);
    });

    it('throws on create()', () => {
        expect(() => gameObject.create()).toThrow();
    });

    it('can add, get, and remove components', () => {
        const mockComponent = { update: jest.fn(), onAttach: jest.fn(), onDetach: jest.fn() };
        gameObject.addComponent('test', mockComponent);
        expect(gameObject.getComponent('test')).toBe(mockComponent);
        expect(mockComponent.onAttach).toHaveBeenCalled();
        gameObject.removeComponent('test');
        expect(gameObject.getComponent('test')).toBeNull();
        expect(mockComponent.onDetach).toHaveBeenCalled();
    });

    it('updates all components', () => {
        const mockComponent = { update: jest.fn() };
        gameObject.addComponent('test', mockComponent);
        gameObject.update(16);
        expect(mockComponent.update).toHaveBeenCalledWith(16);
    });

    it('getSprite returns sprite', () => {
        expect(gameObject.getSprite()).toBe(mockSprite);
    });

    it('getPosition returns sprite position if sprite exists', () => {
        mockSprite.x = 5;
        mockSprite.y = 7;
        expect(gameObject.getPosition()).toEqual({ x: 5, y: 7 });
    });

    it('getPosition returns x/y if no sprite', () => {
        gameObject.sprite = null;
        expect(gameObject.getPosition()).toEqual({ x: 10, y: 20 });
    });

    it('setPosition updates x/y and sprite', () => {
        gameObject.setPosition(100, 200);
        expect(gameObject.x).toBe(100);
        expect(gameObject.y).toBe(200);
        expect(mockSprite.setPosition).toHaveBeenCalledWith(100, 200);
    });

    it('destroy cleans up components and sprite', () => {
        const mockComponent = { onDetach: jest.fn() };
        gameObject.addComponent('test', mockComponent);
        gameObject.destroy();
        expect(mockComponent.onDetach).toHaveBeenCalled();
        expect(gameObject.components.size).toBe(0);
        expect(mockSprite.destroy).toHaveBeenCalled();
        expect(gameObject.isDestroyed).toBe(true);
    });

    it('destroy is idempotent', () => {
        gameObject.isDestroyed = true;
        gameObject.destroy();
        // Should not throw or call anything
        expect(gameObject.isDestroyed).toBe(true);
    });
});
