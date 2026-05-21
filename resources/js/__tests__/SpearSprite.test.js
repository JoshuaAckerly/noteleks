import SpearSprite from '../SpearSprite.js';

function makePlayer({ flipX = false, x = 100, y = 200 } = {}) {
    return { sprite: { x, y, flipX } };
}

function makeWeapon({ x = 300, y = 150, rotation = 0.5 } = {}) {
    return { x, y, rotation };
}

function makeScene() {
    const mockImage = {
        setScale: jest.fn().mockReturnThis(),
        setDepth: jest.fn().mockReturnThis(),
        setFlipX: jest.fn().mockReturnThis(),
        setPosition: jest.fn(),
        setRotation: jest.fn(),
        destroy: jest.fn(),
    };
    return {
        add: { image: jest.fn(() => mockImage) },
        _mockImage: mockImage,
    };
}

describe('SpearSprite', () => {
    it('creates a scene image on construction', () => {
        const scene = makeScene();
        new SpearSprite(scene, makePlayer());

        expect(scene.add.image).toHaveBeenCalledTimes(1);
    });

    it('positions image with positive x offset when facing right', () => {
        const scene = makeScene();
        new SpearSprite(scene, makePlayer({ flipX: false, x: 100, y: 200 }));

        const [x] = scene.add.image.mock.calls[0];
        expect(x).toBeGreaterThan(100);
    });

    it('positions image with negative x offset when facing left', () => {
        const scene = makeScene();
        new SpearSprite(scene, makePlayer({ flipX: true, x: 100, y: 200 }));

        const [x] = scene.add.image.mock.calls[0];
        expect(x).toBeLessThan(100);
    });

    it('destroy removes image from scene', () => {
        const scene = makeScene();
        const spearSprite = new SpearSprite(scene, makePlayer());

        spearSprite.destroy();

        expect(scene._mockImage.destroy).toHaveBeenCalledTimes(1);
    });

    it('destroy nulls the image reference so double-destroy is a no-op', () => {
        const scene = makeScene();
        const spearSprite = new SpearSprite(scene, makePlayer());

        spearSprite.destroy();
        spearSprite.destroy();

        expect(scene._mockImage.destroy).toHaveBeenCalledTimes(1);
    });

    it('update tracks the weapon projectile position and rotation', () => {
        const scene = makeScene();
        const spearSprite = new SpearSprite(scene, makePlayer());
        const weapon = makeWeapon({ x: 350, y: 175, rotation: 1.2 });

        spearSprite.update(weapon);

        expect(scene._mockImage.setPosition).toHaveBeenCalledWith(350, 175);
        expect(scene._mockImage.setRotation).toHaveBeenCalledWith(1.2);
    });
});
