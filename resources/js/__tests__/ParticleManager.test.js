import ParticleManager from '../managers/ParticleManager.js';

// The Jest environment is 'node', so document is not available.
// Provide a minimal canvas mock so _createTexture can call textures.addCanvas.
function makeMockCanvas() {
    return { width: 0, height: 0, getContext: jest.fn(() => null) };
}

beforeAll(() => {
    global.document = { createElement: jest.fn(() => makeMockCanvas()) };
});

function makeMockEmitter() {
    return {
        setDepth: jest.fn().mockReturnThis(),
        explode:  jest.fn(),
        destroy:  jest.fn(),
        scene:    true,
    };
}

function makeMockScene(now = 1000) {
    return {
        add: {
            particles: jest.fn(() => makeMockEmitter()),
        },
        textures: {
            exists:    jest.fn(() => false),
            addCanvas: jest.fn(),
        },
        time: {
            now:         now,
            delayedCall: jest.fn(),
        },
    };
}

describe('ParticleManager', () => {
    describe('construction', () => {
        it('creates a particle texture when none exists', () => {
            const scene = makeMockScene();
            new ParticleManager(scene);

            expect(scene.textures.exists).toHaveBeenCalledWith('noteleks-particle');
            expect(scene.textures.addCanvas).toHaveBeenCalled();
        });

        it('skips texture creation when the key already exists', () => {
            const scene = makeMockScene();
            scene.textures.exists.mockReturnValue(true);
            new ParticleManager(scene);

            expect(scene.textures.addCanvas).not.toHaveBeenCalled();
        });

        it('creates 6 persistent emitters (hit, damage, landing, aura high/mid/low)', () => {
            const scene = makeMockScene();
            new ParticleManager(scene);

            expect(scene.add.particles).toHaveBeenCalledTimes(6);
        });
    });

    describe('spearHit', () => {
        it('calls explode on the hit emitter', () => {
            const scene = makeMockScene();
            const pm = new ParticleManager(scene);

            pm.spearHit(100, 200);

            expect(pm._hitEmitter.explode).toHaveBeenCalledWith(15, 100, 200);
        });
    });

    describe('playerDamage', () => {
        it('calls explode on the damage emitter', () => {
            const scene = makeMockScene();
            const pm = new ParticleManager(scene);

            pm.playerDamage(50, 300);

            expect(pm._damageEmitter.explode).toHaveBeenCalledWith(10, 50, 300);
        });
    });

    describe('landing', () => {
        it('calls explode on the landing emitter', () => {
            const scene = makeMockScene();
            const pm = new ParticleManager(scene);

            pm.landing(400, 580);

            expect(pm._landingEmitter.explode).toHaveBeenCalledWith(8, 400, 580);
        });
    });

    describe('enemyDeath', () => {
        it('creates a fresh emitter with the enemy colour and calls explode', () => {
            const scene = makeMockScene();
            const pm = new ParticleManager(scene);
            // Reset call count after construction
            scene.add.particles.mockClear();

            pm.enemyDeath(500, 100, 0x00ff00);

            expect(scene.add.particles).toHaveBeenCalledTimes(1);
            const config = scene.add.particles.mock.calls[0][3];
            expect(config.tint).toBe(0x00ff00);

            // Should call explode with 20 particles
            const emitter = scene.add.particles.mock.results[0].value;
            expect(emitter.explode).toHaveBeenCalledWith(20, 500, 100);
        });

        it('schedules auto-destroy via delayedCall', () => {
            const scene = makeMockScene();
            const pm = new ParticleManager(scene);
            scene.add.particles.mockClear();

            pm.enemyDeath(0, 0, 0xff0000);

            expect(scene.time.delayedCall).toHaveBeenCalledWith(650, expect.any(Function));
        });

        it('uses default colour 0xff4444 when none supplied', () => {
            const scene = makeMockScene();
            const pm = new ParticleManager(scene);
            scene.add.particles.mockClear();

            pm.enemyDeath(0, 0);

            const config = scene.add.particles.mock.calls[0][3];
            expect(config.tint).toBe(0xff4444);
        });
    });

    describe('player aura (green)', () => {
        function makeSprite(x = 200, y = 400, displayHeight = 64) {
            return { x, y, displayHeight };
        }

        it('sets _auraActive when startPlayerAura is called', () => {
            const scene = makeMockScene();
            const pm = new ParticleManager(scene);

            pm.startPlayerAura(makeSprite());

            expect(pm._auraActive).toBe(true);
        });

        it('stores the sprite reference on start', () => {
            const scene = makeMockScene();
            const pm = new ParticleManager(scene);
            const sprite = makeSprite();

            pm.startPlayerAura(sprite);

            expect(pm._auraSprite).toBe(sprite);
        });

        it('does nothing when startPlayerAura is called without a sprite', () => {
            const scene = makeMockScene();
            const pm = new ParticleManager(scene);

            expect(() => pm.startPlayerAura(null)).not.toThrow();
            expect(pm._auraActive).toBe(false);
        });

        it('stopPlayerAura clears active flag and sprite', () => {
            const scene = makeMockScene();
            const pm = new ParticleManager(scene);
            pm.startPlayerAura(makeSprite());

            pm.stopPlayerAura();

            expect(pm._auraActive).toBe(false);
            expect(pm._auraSprite).toBeNull();
        });

        it('updatePlayerAura calls explode at the chest world position with full-health defaults', () => {
            // time.now starts at 1000, _auraLastEmit resets to 0 on start,
            // so 1000 - 0 = 1000 > 45 → first call fires.
            const scene = makeMockScene(1000);
            const pm = new ParticleManager(scene);
            const sprite = makeSprite(300, 500, 80);
            pm.startPlayerAura(sprite);

            pm.updatePlayerAura();

            const expectedY = 500 - 80 * 0.7;
            // Full health (default 1.0) → high emitter, count = 3
            expect(pm._auraHighEmitter.explode).toHaveBeenCalledWith(3, 300, expectedY);
        });

        it('updatePlayerAura respects the interval and skips when called too soon', () => {
            const scene = makeMockScene(1000);
            const pm = new ParticleManager(scene);
            pm.startPlayerAura(makeSprite());

            // First call fires (delta = 1000)
            pm.updatePlayerAura();
            pm._auraHighEmitter.explode.mockClear();

            // Second call immediately (scene.time.now unchanged = 1000, delta = 0)
            pm.updatePlayerAura();
            expect(pm._auraHighEmitter.explode).not.toHaveBeenCalled();
        });

        it('updatePlayerAura does nothing when inactive', () => {
            const scene = makeMockScene(1000);
            const pm = new ParticleManager(scene);

            expect(() => pm.updatePlayerAura()).not.toThrow();
            expect(pm._auraHighEmitter.explode).not.toHaveBeenCalled();
        });

        it('aura emitters use green tints', () => {
            const scene = makeMockScene();
            new ParticleManager(scene);

            // Calls 4, 5, 6 (0-indexed: 3, 4, 5) are auraHigh, auraMid, auraLow
            [3, 4, 5].forEach(idx => {
                const config = scene.add.particles.mock.calls[idx][3];
                const tint   = config.tint;
                const g = (tint >> 8) & 0xff;
                const r = (tint >> 16) & 0xff;
                expect(g).toBeGreaterThan(0);
                expect(r).toBe(0);
            });
        });

        describe('health-driven intensity (setAuraHealth)', () => {
            it('defaults to full health (1.0)', () => {
                const scene = makeMockScene();
                const pm = new ParticleManager(scene);
                expect(pm._auraHealth).toBe(1.0);
            });

            it('clamps below 0 to 0', () => {
                const scene = makeMockScene();
                const pm = new ParticleManager(scene);
                pm.setAuraHealth(-10, 100);
                expect(pm._auraHealth).toBe(0);
            });

            it('clamps above max to 1', () => {
                const scene = makeMockScene();
                const pm = new ParticleManager(scene);
                pm.setAuraHealth(150, 100);
                expect(pm._auraHealth).toBe(1);
            });

            it('computes correct ratio', () => {
                const scene = makeMockScene();
                const pm = new ParticleManager(scene);
                pm.setAuraHealth(50, 100);
                expect(pm._auraHealth).toBeCloseTo(0.5);
            });

            it('emits 3 particles at full health', () => {
                const scene = makeMockScene(1000);
                const pm = new ParticleManager(scene);
                pm.setAuraHealth(100, 100);
                pm.startPlayerAura(makeSprite());
                pm.updatePlayerAura();
                expect(pm._auraHighEmitter.explode).toHaveBeenCalledWith(3, expect.any(Number), expect.any(Number));
            });

            it('emits 2 particles at half health', () => {
                const scene = makeMockScene(1000);
                const pm = new ParticleManager(scene);
                pm.setAuraHealth(50, 100);
                pm.startPlayerAura(makeSprite());
                pm.updatePlayerAura();
                expect(pm._auraMidEmitter.explode).toHaveBeenCalledWith(2, expect.any(Number), expect.any(Number));
            });

            it('emits 1 particle at low health', () => {
                const scene = makeMockScene(1000);
                const pm = new ParticleManager(scene);
                pm.setAuraHealth(10, 100);
                pm.startPlayerAura(makeSprite());
                pm.updatePlayerAura();
                expect(pm._auraLowEmitter.explode).toHaveBeenCalledWith(1, expect.any(Number), expect.any(Number));
            });

            it('uses a larger scale at full health than at low health', () => {
                // _auraHighEmitter is built with scale.start: 0.75
                // _auraLowEmitter is built with scale.start: 0.25
                const scene = makeMockScene();
                new ParticleManager(scene);
                const highConfig = scene.add.particles.mock.calls[3][3]; // auraHigh
                const lowConfig  = scene.add.particles.mock.calls[5][3]; // auraLow

                expect(highConfig.scale.start).toBeGreaterThan(lowConfig.scale.start);
            });
        });
    });
});
