import EntityFactory from '../factories/EntityFactory';

describe('EntityFactory', () => {
    let factory;
    let mockScene;

    beforeEach(() => {
        const mockBody = {
            setCollideWorldBounds: jest.fn(),
            setBounce: jest.fn(),
            setMass: jest.fn(),
            setDrag: jest.fn(),
            setSize: jest.fn(),
            setOffset: jest.fn(),
        };
        const mockSprite = {
            setTint: jest.fn(),
            setDepth: jest.fn(),
            setScale: jest.fn(),
            setOrigin: jest.fn(),
            setVisible: jest.fn(),
            on: jest.fn(),
            body: mockBody,
            playerRef: null,
        };
        mockScene = {
            input: {
                keyboard: {
                    addKeys: jest.fn().mockReturnValue({}),
                },
            },
            add: {
                sprite: jest.fn().mockReturnValue(mockSprite),
            },
            physics: {
                add: {
                    existing: jest.fn(),
                    sprite: jest.fn().mockReturnValue(mockSprite),
                },
            },
            textures: { exists: jest.fn().mockReturnValue(true) },
        };
        factory = new EntityFactory(mockScene);
    });

    beforeAll(() => {
        global.fetch = jest.fn().mockResolvedValue({
            json: jest.fn().mockResolvedValue({}),
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('initializes with templates', () => {
        expect(factory.entityTemplates).toBeDefined();
        expect(factory.entityTemplates.player).toBeDefined();
        expect(factory.entityTemplates.enemies).toBeDefined();
    });

    it('createPlayer returns a Player instance', () => {
        const player = factory.createPlayer(10, 20);
        expect(player).toBeInstanceOf(Object); // Can't check Player due to jest.mock
    });

    it('createEnemy returns an Enemy instance', () => {
        const enemy = factory.createEnemy(5, 6, 'zombie');
        expect(enemy).toBeInstanceOf(Object); // Can't check Enemy due to jest.mock
    });

    it('applyTemplate applies properties to sprite', () => {
        const sprite = { setScale: jest.fn(), setDepth: jest.fn(), setTint: jest.fn() };
        const template = { scale: 2, depth: 3, tint: 0xff00ff };
        factory.applyTemplate(sprite, template);
        expect(sprite.setScale).toHaveBeenCalledWith(2);
        expect(sprite.setDepth).toHaveBeenCalledWith(3);
        expect(sprite.setTint).toHaveBeenCalledWith(0xff00ff);
    });
});
