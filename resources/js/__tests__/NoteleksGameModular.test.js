let NoteleksGame;

const createPhaserMock = () => ({
    AUTO: 0,
    Scale: { FIT: 1, CENTER_BOTH: 2 },
    Scene: class {},
    Game: jest.fn().mockImplementation(() => ({
        events: { once: jest.fn() },
        scene: { getScene: jest.fn().mockReturnValue({ gameState: 'playing', pauseGame: jest.fn(), resumeGame: jest.fn() }) },
        destroy: jest.fn(),
    })),
});

describe('NoteleksGame', () => {
    let game;
    let origPhaser;
    let origWindow;
    let origDocument;

    beforeAll(async () => {
        global.Phaser = createPhaserMock();
        ({ default: NoteleksGame } = await import('../NoteleksGameModular.js'));
    });

    beforeEach(() => {
        origPhaser = global.Phaser;
        global.Phaser = createPhaserMock();
        origWindow = global.window;
        global.window = {
            addEventListener: jest.fn(),
            onerror: null,
            noteleks_lowQuality: false,
            navigator: { userAgent: '', deviceMemory: 4, hardwareConcurrency: 4, sendBeacon: jest.fn() },
            localStorage: { setItem: jest.fn() },
            spine: { SpinePlugin: function SpinePlugin() {} },
        };
        origDocument = global.document;
        global.document = { getElementById: jest.fn().mockReturnValue({}), addEventListener: jest.fn(), hidden: false };
    });

    afterEach(() => {
        global.Phaser = origPhaser;
        global.window = origWindow;
        global.document = origDocument;
    });

    it('constructs and sets up config', () => {
        game = new NoteleksGame();
        expect(game.config).toBeDefined();
    });

    it('registers the Spine scene plugin when available', () => {
        game = new NoteleksGame();
        expect(game.config.plugins.scene[0].key).toBe('spine');
        expect(game.config.plugins.scene[0].mapping).toBe('spine');
    });

    it('createGameConfig throws if Phaser is undefined', () => {
        global.Phaser = undefined;
        expect(() => new NoteleksGame()).toThrow();
    });

    it('initialize returns false if container not found', async () => {
        global.document.getElementById = jest.fn().mockReturnValue(null);
        game = new NoteleksGame();
        await expect(game.initialize('bad-id')).resolves.toBe(false);
    });

    it('initialize creates Phaser.Game and sets up listeners', async () => {
        game = new NoteleksGame();
        await expect(game.initialize('phaser-game')).resolves.toBe(true);
        expect(game.game).toBeDefined();
    });

    it('pause and resume call scene methods', () => {
        game = new NoteleksGame();
        game.game = { scene: { getScene: jest.fn().mockReturnValue({ gameState: 'playing', pauseGame: jest.fn(), resumeGame: jest.fn() }) } };
        game.pause();
        game.game.scene.getScene = jest.fn().mockReturnValue({ gameState: 'paused', resumeGame: jest.fn() });
        game.resume();
    });

    it('destroy cleans up game', () => {
        game = new NoteleksGame();
        game.game = { destroy: jest.fn() };
        game.destroy();
        expect(game.game).toBeNull();
    });

    it('getGame, getScene, isRunning, getConfig work', () => {
        game = new NoteleksGame();
        game.game = { isRunning: true, scene: { getScene: jest.fn().mockReturnValue('scene') } };
        expect(game.getGame()).toBe(game.game);
        expect(game.getScene()).toBe('scene');
        expect(game.isRunning()).toBe(true);
        expect(game.getConfig()).toBe(game.config);
    });

    it('static create returns game or null', async () => {
        NoteleksGame.prototype.initialize = jest.fn().mockResolvedValue(true);
        const g = await NoteleksGame.create('phaser-game');
        expect(g).toBeInstanceOf(NoteleksGame);
        NoteleksGame.prototype.initialize = jest.fn().mockResolvedValue(false);
        const g2 = await NoteleksGame.create('phaser-game');
        expect(g2).toBeNull();
    });
});
