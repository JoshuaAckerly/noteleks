import AssetManager from '../utils/AssetManagerSimple.js';

describe('AssetManager', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            textures: {
                exists: jest.fn().mockReturnValue(false),
                get: jest.fn().mockReturnValue({ getSourceImage: jest.fn().mockReturnValue('img') }),
                addImage: jest.fn(),
            },
            add: {
                graphics: jest.fn().mockReturnValue({ fillStyle: jest.fn(), fillRect: jest.fn(), generateTexture: jest.fn(), destroy: jest.fn() }),
            },
            load: { image: jest.fn(), once: jest.fn((event, cb) => cb()) },
            anims: {
                exists: jest.fn().mockReturnValue(false),
                create: jest.fn(),
                get: jest.fn().mockReturnValue({ frames: [{ textureKey: 'k', frame: { name: 'f' } }] }),
            },
        };
    });

    it('createPlaceholderTextures creates textures', () => {
        const config = { assets: { textures: { foo: { color: 0xff0000, width: 10, height: 20 } } } };
        AssetManager.createPlaceholderTextures(mockScene, config);
        expect(mockScene.add.graphics).toHaveBeenCalled();
    });

    it('queueAssetsFromManifest enqueues images and creates anims', () => {
        const manifest = { frameSequences: { '/foo/bar_': ['a.webp', 'b.webp'] } };
        AssetManager.queueAssetsFromManifest(mockScene, manifest);
        expect(mockScene.load.image).toHaveBeenCalled();
        expect(mockScene.anims.create).toHaveBeenCalled();
    });

    it('loadFrameSequence enqueues images and creates anim', () => {
        AssetManager.loadFrameSequence(mockScene, 'anim', '/foo/', 2);
        expect(mockScene.load.image).toHaveBeenCalled();
        expect(mockScene.anims.create).toHaveBeenCalled();
    });

    it('setupSpineData returns false', () => {
        expect(AssetManager.setupSpineData(mockScene)).toBe(false);
    });

    describe('frame ordering determinism', () => {
        it('enqueues frames in manifest order with sequential keys', () => {
            const manifest = {
                frameSequences: {
                    '/games/noteleks/sprites/Skeleton-Idle_': ['Skeleton-Idle_00.webp', 'Skeleton-Idle_01.webp', 'Skeleton-Idle_02.webp'],
                },
            };
            AssetManager.queueAssetsFromManifest(mockScene, manifest);

            const imageCalls = mockScene.load.image.mock.calls;
            expect(imageCalls[0]).toEqual(['skeleton-idle-0', '/games/noteleks/sprites/Skeleton-Idle_00.webp']);
            expect(imageCalls[1]).toEqual(['skeleton-idle-1', '/games/noteleks/sprites/Skeleton-Idle_01.webp']);
            expect(imageCalls[2]).toEqual(['skeleton-idle-2', '/games/noteleks/sprites/Skeleton-Idle_02.webp']);
        });

        it('creates animation with frames in correct sequential order', () => {
            const manifest = {
                frameSequences: {
                    '/games/noteleks/sprites/Skeleton-Run_': [
                        'Skeleton-Run_00.webp',
                        'Skeleton-Run_01.webp',
                        'Skeleton-Run_02.webp',
                        'Skeleton-Run_03.webp',
                    ],
                },
            };
            AssetManager.queueAssetsFromManifest(mockScene, manifest);

            const createCalls = mockScene.anims.create.mock.calls;
            const animCall = createCalls.find((c) => c[0].key === 'skeleton-run');
            expect(animCall).toBeDefined();
            expect(animCall[0].frames).toEqual([
                { key: 'skeleton-run-0' },
                { key: 'skeleton-run-1' },
                { key: 'skeleton-run-2' },
                { key: 'skeleton-run-3' },
            ]);
        });
    });

    describe('animConfig overrides', () => {
        it('applies custom frameRate and repeat from animConfig', () => {
            const manifest = {
                frameSequences: {
                    '/sprites/Skeleton-Attack1_': ['Skeleton-Attack1_0.webp', 'Skeleton-Attack1_1.webp'],
                },
            };
            const animConfig = {
                'skeleton-attack1': { frameRate: 10, repeat: 0 },
            };
            AssetManager.queueAssetsFromManifest(mockScene, manifest, animConfig);

            const createCalls = mockScene.anims.create.mock.calls;
            const animCall = createCalls.find((c) => c[0].key === 'skeleton-attack1');
            expect(animCall[0].frameRate).toBe(10);
            expect(animCall[0].repeat).toBe(0);
        });

        it('defaults to 12fps repeat -1 when no animConfig provided', () => {
            const manifest = {
                frameSequences: {
                    '/sprites/Skeleton-Walk_': ['Skeleton-Walk_00.webp', 'Skeleton-Walk_01.webp'],
                },
            };
            AssetManager.queueAssetsFromManifest(mockScene, manifest);

            const createCalls = mockScene.anims.create.mock.calls;
            const animCall = createCalls.find((c) => c[0].key === 'skeleton-walk');
            expect(animCall[0].frameRate).toBe(12);
            expect(animCall[0].repeat).toBe(-1);
        });

        it('defaults to 12fps repeat -1 for unlisted animations', () => {
            const manifest = {
                frameSequences: {
                    '/sprites/Skeleton-WallSlide_': ['Skeleton-WallSlide_0.webp'],
                },
            };
            const animConfig = {
                'skeleton-idle': { frameRate: 8, repeat: -1 },
            };
            AssetManager.queueAssetsFromManifest(mockScene, manifest, animConfig);

            const createCalls = mockScene.anims.create.mock.calls;
            const animCall = createCalls.find((c) => c[0].key === 'skeleton-wallslide');
            expect(animCall[0].frameRate).toBe(12);
            expect(animCall[0].repeat).toBe(-1);
        });
    });

    describe('alias mapping', () => {
        it('creates player-idle alias from skeleton-idle', () => {
            const manifest = {
                frameSequences: {
                    '/sprites/Skeleton-Idle_': ['Skeleton-Idle_00.webp', 'Skeleton-Idle_01.webp'],
                },
            };
            AssetManager.queueAssetsFromManifest(mockScene, manifest);

            const createCalls = mockScene.anims.create.mock.calls;
            const aliasCall = createCalls.find((c) => c[0].key === 'player-idle');
            expect(aliasCall).toBeDefined();
        });

        it('maps skeleton-jump to player-jump', () => {
            const manifest = {
                frameSequences: {
                    '/sprites/Skeleton-Jump_': ['Skeleton-Jump_0.webp'],
                },
            };
            AssetManager.queueAssetsFromManifest(mockScene, manifest);

            const createCalls = mockScene.anims.create.mock.calls;
            const jumpCall = createCalls.find((c) => c[0].key === 'player-jump');
            expect(jumpCall).toBeDefined();
        });

        it('maps skeleton-jumpattack to player-jump-attack', () => {
            const manifest = {
                frameSequences: {
                    '/sprites/Skeleton-JumpAttack_': ['Skeleton-JumpAttack_0.webp', 'Skeleton-JumpAttack_1.webp'],
                },
            };
            AssetManager.queueAssetsFromManifest(mockScene, manifest);

            const createCalls = mockScene.anims.create.mock.calls;
            const jumpAttackCall = createCalls.find((c) => c[0].key === 'player-jump-attack');
            expect(jumpAttackCall).toBeDefined();
        });

        it('maps skeleton-attack1 to player-attack', () => {
            const manifest = {
                frameSequences: {
                    '/sprites/Skeleton-Attack1_': ['Skeleton-Attack1_0.webp'],
                },
            };
            AssetManager.queueAssetsFromManifest(mockScene, manifest);

            const createCalls = mockScene.anims.create.mock.calls;
            const attackCall = createCalls.find((c) => c[0].key === 'player-attack');
            expect(attackCall).toBeDefined();
        });

        it('jump alias inherits animConfig from source animation', () => {
            const manifest = {
                frameSequences: {
                    '/sprites/Skeleton-Jump_': ['Skeleton-Jump_0.webp'],
                },
            };
            const animConfig = { 'skeleton-jump': { frameRate: 1, repeat: 0 } };
            AssetManager.queueAssetsFromManifest(mockScene, manifest, animConfig);

            const createCalls = mockScene.anims.create.mock.calls;
            const aliasCall = createCalls.find((c) => c[0].key === 'player-jump');
            expect(aliasCall[0].frameRate).toBe(1);
            expect(aliasCall[0].repeat).toBe(0);
        });

        it('jump-attack alias inherits animConfig from source animation', () => {
            const manifest = {
                frameSequences: {
                    '/sprites/Skeleton-JumpAttack_': ['Skeleton-JumpAttack_0.webp', 'Skeleton-JumpAttack_1.webp'],
                },
            };
            const animConfig = { 'skeleton-jumpattack': { frameRate: 15, repeat: 0 } };
            AssetManager.queueAssetsFromManifest(mockScene, manifest, animConfig);

            const createCalls = mockScene.anims.create.mock.calls;
            const aliasCall = createCalls.find((c) => c[0].key === 'player-jump-attack');
            expect(aliasCall[0].frameRate).toBe(15);
            expect(aliasCall[0].repeat).toBe(0);
        });
    });

    describe('full manifest integration', () => {
        it('processes a real manifest and creates all expected animations', () => {
            // Simulate the actual generated manifest structure
            const manifest = {
                frameSequences: {
                    '/games/noteleks/sprites/Skeleton-Idle_': Array.from(
                        { length: 16 },
                        (_, i) => `Skeleton-Idle_${String(i).padStart(2, '0')}.webp`,
                    ),
                    '/games/noteleks/sprites/Skeleton-Run_': Array.from({ length: 16 }, (_, i) => `Skeleton-Run_${String(i).padStart(2, '0')}.webp`),
                    '/games/noteleks/sprites/Skeleton-Attack1_': ['Skeleton-Attack1_0.webp', 'Skeleton-Attack1_1.webp', 'Skeleton-Attack1_2.webp'],
                    '/games/noteleks/sprites/Skeleton-JumpAttack_': Array.from({ length: 8 }, (_, i) => `Skeleton-JumpAttack_${i}.webp`),
                    '/games/noteleks/sprites/Skeleton-Jump_': ['Skeleton-Jump_0.webp'],
                },
            };
            const animConfig = {
                'skeleton-idle': { frameRate: 8, repeat: -1 },
                'skeleton-run': { frameRate: 12, repeat: -1 },
                'skeleton-jump': { frameRate: 1, repeat: 0 },
                'skeleton-attack1': { frameRate: 10, repeat: 0 },
                'skeleton-jumpattack': { frameRate: 15, repeat: 0 },
            };

            AssetManager.queueAssetsFromManifest(mockScene, manifest, animConfig);

            // Verify total image loads: 16 + 16 + 3 + 8 + 1 = 44
            expect(mockScene.load.image).toHaveBeenCalledTimes(44);

            const createdKeys = mockScene.anims.create.mock.calls.map((c) => c[0].key);
            // Source animations
            expect(createdKeys).toContain('skeleton-idle');
            expect(createdKeys).toContain('skeleton-run');
            expect(createdKeys).toContain('skeleton-attack1');
            expect(createdKeys).toContain('skeleton-jumpattack');
            expect(createdKeys).toContain('skeleton-jump');
            // Alias animations
            expect(createdKeys).toContain('player-idle');
            expect(createdKeys).toContain('player-run');
            expect(createdKeys).toContain('player-attack');
            expect(createdKeys).toContain('player-jump');
            expect(createdKeys).toContain('player-jump-attack');

            // Verify idle has correct config
            const idle = mockScene.anims.create.mock.calls.find((c) => c[0].key === 'skeleton-idle');
            expect(idle[0].frames).toHaveLength(16);
            expect(idle[0].frameRate).toBe(8);

            // Verify attack has repeat 0
            const attack = mockScene.anims.create.mock.calls.find((c) => c[0].key === 'skeleton-attack1');
            expect(attack[0].frames).toHaveLength(3);
            expect(attack[0].repeat).toBe(0);

            const jump = mockScene.anims.create.mock.calls.find((c) => c[0].key === 'skeleton-jump');
            expect(jump[0].frames).toHaveLength(1);
            expect(jump[0].frameRate).toBe(1);
        });

        it('gracefully handles empty manifest', () => {
            expect(() => AssetManager.queueAssetsFromManifest(mockScene, {})).not.toThrow();
            expect(() => AssetManager.queueAssetsFromManifest(mockScene, null)).not.toThrow();
            expect(() => AssetManager.queueAssetsFromManifest(null, {})).not.toThrow();
        });
    });
});
