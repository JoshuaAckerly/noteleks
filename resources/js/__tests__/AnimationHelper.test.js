import { ALIAS_MAP, createAlias, createAnimation, promoteFirstFrameTexture } from '../utils/AnimationHelper.js';

describe('AnimationHelper', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            textures: {
                exists: jest.fn().mockReturnValue(false),
                get: jest.fn().mockReturnValue({ getSourceImage: jest.fn().mockReturnValue('img') }),
                addImage: jest.fn(),
            },
            anims: {
                exists: jest.fn().mockReturnValue(false),
                create: jest.fn(),
                get: jest.fn().mockReturnValue({
                    frames: [
                        { textureKey: 'skeleton-idle-0', frame: { name: 'f0' } },
                        { textureKey: 'skeleton-idle-1', frame: { name: 'f1' } },
                    ],
                }),
            },
        };
    });

    describe('ALIAS_MAP', () => {
        it('maps skeleton-jump to player-jump', () => {
            expect(ALIAS_MAP['skeleton-jump']).toBe('player-jump');
        });

        it('maps skeleton-jumpattack to player-jump-attack', () => {
            expect(ALIAS_MAP['skeleton-jumpattack']).toBe('player-jump-attack');
        });

        it('maps skeleton-attack1 to player-attack', () => {
            expect(ALIAS_MAP['skeleton-attack1']).toBe('player-attack');
        });

        it('keeps jump and jump-attack aliases separate', () => {
            expect(ALIAS_MAP['skeleton-jump']).not.toBe(ALIAS_MAP['skeleton-jumpattack']);
        });
    });

    describe('createAnimation', () => {
        it('creates animation with sequential frame keys', () => {
            createAnimation(mockScene, 'skeleton-run', 4, { frameRate: 12, repeat: -1 });

            expect(mockScene.anims.create).toHaveBeenCalledWith({
                key: 'skeleton-run',
                frames: [{ key: 'skeleton-run-0' }, { key: 'skeleton-run-1' }, { key: 'skeleton-run-2' }, { key: 'skeleton-run-3' }],
                frameRate: 12,
                repeat: -1,
            });
        });

        it('uses defaults when cfg is empty', () => {
            createAnimation(mockScene, 'test-anim', 2);

            const call = mockScene.anims.create.mock.calls[0][0];
            expect(call.frameRate).toBe(12);
            expect(call.repeat).toBe(-1);
        });

        it('respects repeat: 0 override', () => {
            createAnimation(mockScene, 'attack', 3, { frameRate: 10, repeat: 0 });

            const call = mockScene.anims.create.mock.calls[0][0];
            expect(call.repeat).toBe(0);
        });

        it('returns true when animation is created', () => {
            expect(createAnimation(mockScene, 'test', 2)).toBe(true);
        });

        it('returns false when animation already exists', () => {
            mockScene.anims.exists.mockReturnValue(true);
            expect(createAnimation(mockScene, 'test', 2)).toBe(false);
        });

        it('returns false for zero or negative frameCount', () => {
            expect(createAnimation(mockScene, 'test', 0)).toBe(false);
            expect(createAnimation(mockScene, 'test', -1)).toBe(false);
        });

        it('returns false for null scene', () => {
            expect(createAnimation(null, 'test', 2)).toBe(false);
        });
    });

    describe('createAlias', () => {
        it('copies frames from source animation under new key', () => {
            createAlias(mockScene, 'skeleton-idle', 'player-idle', { frameRate: 8, repeat: -1 });

            expect(mockScene.anims.get).toHaveBeenCalledWith('skeleton-idle');
            const call = mockScene.anims.create.mock.calls[0][0];
            expect(call.key).toBe('player-idle');
            expect(call.frames).toHaveLength(2);
            expect(call.frameRate).toBe(8);
        });

        it('returns false when alias already exists', () => {
            mockScene.anims.exists.mockReturnValue(true);
            expect(createAlias(mockScene, 'source', 'alias')).toBe(false);
        });

        it('returns false when source animation has no frames', () => {
            mockScene.anims.get.mockReturnValue({ frames: [] });
            expect(createAlias(mockScene, 'source', 'alias')).toBe(false);
        });

        it('returns false when source animation does not exist', () => {
            mockScene.anims.get.mockReturnValue(null);
            expect(createAlias(mockScene, 'source', 'alias')).toBe(false);
        });
    });

    describe('promoteFirstFrameTexture', () => {
        it('adds standalone texture from first frame when not already present', () => {
            mockScene.textures.exists.mockImplementation((key) => key === 'skeleton-idle-0');

            promoteFirstFrameTexture(mockScene, 'skeleton-idle');

            expect(mockScene.textures.get).toHaveBeenCalledWith('skeleton-idle-0');
            expect(mockScene.textures.addImage).toHaveBeenCalledWith('skeleton-idle', 'img');
        });

        it('skips when base texture already exists', () => {
            mockScene.textures.exists.mockReturnValue(true);

            promoteFirstFrameTexture(mockScene, 'skeleton-idle');

            expect(mockScene.textures.addImage).not.toHaveBeenCalled();
        });

        it('skips when first frame texture does not exist', () => {
            mockScene.textures.exists.mockReturnValue(false);

            promoteFirstFrameTexture(mockScene, 'skeleton-idle');

            expect(mockScene.textures.addImage).not.toHaveBeenCalled();
        });
    });
});
