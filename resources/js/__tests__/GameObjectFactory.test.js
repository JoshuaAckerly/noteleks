import GameObjectFactory from '../factories/GameObjectFactory';

describe('GameObjectFactory', () => {
    let factory;
    let mockScene;
    let mockWeaponManager;

    beforeEach(() => {
        mockWeaponManager = { createWeapon: jest.fn().mockReturnValue('weapon') };
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
            weaponManager: mockWeaponManager,
            input: {
                keyboard: {
                    addKeys: jest.fn().mockReturnValue({}),
                },
            },
            physics: {
                add: {
                    staticSprite: jest.fn().mockReturnValue({ setScale: jest.fn(), refreshBody: jest.fn() }),
                    sprite: jest.fn().mockReturnValue(mockSprite),
                },
            },
            textures: { exists: jest.fn().mockReturnValue(true) },
        };
        factory = new GameObjectFactory(mockScene);
    });

    it('createPlayer returns a Player', () => {
        const player = factory.createPlayer(1, 2);
        expect(player).toBeInstanceOf(Object);
    });

    it('createEnemy returns an Enemy', () => {
        const enemy = factory.createEnemy(3, 4, 'zombie');
        expect(enemy).toBeInstanceOf(Object);
    });

    it('createWeapon delegates to weaponManager', () => {
        const weapon = factory.createWeapon(5, 6, 'sword', 'right', { x: 10, y: 20 });
        expect(mockWeaponManager.createWeapon).toHaveBeenCalledWith(5, 6, 'right', { x: 10, y: 20 });
        expect(weapon).toBe('weapon');
    });

    it('createWeapon returns null if no weaponManager', () => {
        const noWeaponFactory = new GameObjectFactory({});
        expect(noWeaponFactory.createWeapon(1, 2, 'sword', 'left')).toBeNull();
    });

    it('createPlatform creates a static platform', () => {
        const platform = factory.createPlatform(7, 8, 128, 64);
        expect(mockScene.physics.add.staticSprite).toHaveBeenCalledWith(7, 8, 'ground');
        expect(platform).toBeDefined();
    });
});
