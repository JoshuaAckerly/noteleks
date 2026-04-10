import Player from '../entities/Player.js';

describe('Player', () => {
    function createMockScene() {
        const mockSprite = {
            on: jest.fn(),
            setOrigin: jest.fn(),
            setScale: jest.fn(),
            setVisible: jest.fn(),
            setDepth: jest.fn(),
            setPosition: jest.fn(),
            flipX: false,
            body: undefined,
        };
        const mockSpine = {
            animationState: {
                addListener: jest.fn(),
                removeListener: jest.fn(),
                setAnimation: jest.fn(),
            },
            setDepth: jest.fn(),
            setScale: jest.fn(),
            setPosition: jest.fn(),
            setVisible: jest.fn(),
            destroy: jest.fn(),
        };
        return {
            physics: {
                add: {
                    sprite: jest.fn(() => mockSprite),
                    existing: jest.fn(),
                },
            },
            add: {
                spine: jest.fn(() => mockSpine),
            },
            input: {
                keyboard: {
                    addKeys: jest.fn(() => ({})),
                },
            },
            textures: {
                exists: jest.fn(() => false),
            },
        };
    }

    it('should construct with correct initial values', () => {
        const mockScene = createMockScene();
        const player = new Player(mockScene, 10, 20);
        expect(player.x).toBe(10);
        expect(player.y).toBe(20);
        expect(player.scene).toBe(mockScene);
    });

    it('should have a sprite after construction', () => {
        const mockScene = createMockScene();
        const player = new Player(mockScene, 0, 0);
        expect(player.sprite).toBeDefined();
    });
});
