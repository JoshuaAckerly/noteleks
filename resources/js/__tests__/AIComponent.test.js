import AIComponent from '../components/AIComponent';

describe('AIComponent', () => {
    let ai;
    let mockGameObject;
    let mockMovement;
    let mockTarget;

    beforeEach(() => {
        mockMovement = {
            moveRight: jest.fn(),
            moveLeft: jest.fn(),
            stopHorizontal: jest.fn(),
            jump: jest.fn(),
            isOnGround: jest.fn().mockReturnValue(true),
            speed: 0,
        };
        mockGameObject = {
            getComponent: jest.fn().mockImplementation((name) => (name === 'movement' ? mockMovement : null)),
            getPosition: jest.fn().mockReturnValue({ x: 0, y: 0 }),
        };
        mockTarget = {
            getPosition: jest.fn().mockReturnValue({ x: 100, y: 0 }),
        };
        ai = new AIComponent('zombie');
        ai.gameObject = mockGameObject;
        ai.setTarget(mockTarget);
    });

    it('initializes with config values', () => {
        expect(ai.aiType).toBe('zombie');
        expect(typeof ai.speed).toBe('number');
        expect(typeof ai.detectionRange).toBe('number');
    });

    it('setTarget and getTarget work', () => {
        expect(ai.getTarget()).toBe(mockTarget);
        const newTarget = { getPosition: jest.fn() };
        ai.setTarget(newTarget);
        expect(ai.getTarget()).toBe(newTarget);
    });

    it('getDistanceToTarget returns correct distance', () => {
        mockGameObject.getPosition.mockReturnValue({ x: 0, y: 0 });
        mockTarget.getPosition.mockReturnValue({ x: 3, y: 4 });
        expect(ai.getDistanceToTarget()).toBe(5);
    });

    it('setDetectionRange and setSpeed update values', () => {
        ai.setDetectionRange(123);
        expect(ai.detectionRange).toBe(123);
        ai.setSpeed(456);
        expect(ai.speed).toBe(456);
        expect(mockMovement.speed).toBe(456);
    });

    it('getTargetPosition handles various target types', () => {
        // getPosition method
        expect(ai.getTargetPosition()).toEqual({ x: 100, y: 0 });
        // sprite property
        ai.setTarget({ sprite: { x: 1, y: 2 } });
        expect(ai.getTargetPosition()).toEqual({ x: 1, y: 2 });
        // direct x/y
        ai.setTarget({ x: 5, y: 6 });
        expect(ai.getTargetPosition()).toEqual({ x: 5, y: 6 });
        // null
        ai.setTarget(null);
        expect(ai.getTargetPosition()).toBeNull();
    });

    it('stun and getIsStunned work', () => {
        ai.stun(100);
        expect(ai.getIsStunned()).toBe(true);
    });

    it('update does nothing if disabled or no target', () => {
        ai.enabled = false;
        ai.update(16);
        ai.enabled = true;
        ai.setTarget(null);
        ai.update(16);
        // Should not throw or call movement
    });

    it('update does not move if stunned', () => {
        ai.isStunned = true;
        ai.stunEndTime = Date.now() + 10000;
        ai.update(16);
        expect(mockMovement.moveRight).not.toHaveBeenCalled();
    });

    it('update chases target if in range', () => {
        ai.detectionRange = 200;
        mockGameObject.getPosition.mockReturnValue({ x: 0, y: 0 });
        mockTarget.getPosition.mockReturnValue({ x: 100, y: 0 });
        ai.update(16);
        expect(mockMovement.moveRight).toHaveBeenCalled();
    });

    it('update stops if target out of range', () => {
        ai.detectionRange = 10;
        mockGameObject.getPosition.mockReturnValue({ x: 0, y: 0 });
        mockTarget.getPosition.mockReturnValue({ x: 100, y: 0 });
        ai.update(16);
        expect(mockMovement.stopHorizontal).toHaveBeenCalled();
    });

    it('chaseTarget jumps if target is above', () => {
        ai.detectionRange = 200;
        mockGameObject.getPosition.mockReturnValue({ x: 0, y: 100 });
        mockTarget.getPosition.mockReturnValue({ x: 0, y: 0 });
        ai.update(16);
        expect(mockMovement.jump).toHaveBeenCalled();
    });

    describe('hasGroundAhead', () => {
        function makeSpriteWithBody(x = 0, y = 0) {
            return {
                x,
                y,
                body: { halfWidth: 16, halfHeight: 20 },
            };
        }

        function makePlatforms(tiles) {
            return {
                getChildren: jest.fn(() =>
                    tiles.map(({ left, right, top, bottom }) => ({
                        body: { left, right, top, bottom },
                    }))
                ),
            };
        }

        it('returns true when a platform exists ahead-and-below', () => {
            // sprite at x=100,y=400; probe right: x≈126,y≈430
            const sprite    = makeSpriteWithBody(100, 400);
            const platforms = makePlatforms([{ left: 120, right: 200, top: 425, bottom: 457 }]);
            mockGameObject.sprite   = sprite;
            mockGameObject.scene    = { platforms };

            expect(ai.hasGroundAhead(1)).toBe(true);
        });

        it('returns false when no platform exists ahead-and-below (ledge)', () => {
            const sprite    = makeSpriteWithBody(100, 400);
            const platforms = makePlatforms([{ left: 0, right: 80, top: 425, bottom: 457 }]); // behind, not ahead
            mockGameObject.sprite   = sprite;
            mockGameObject.scene    = { platforms };

            expect(ai.hasGroundAhead(1)).toBe(false);
        });

        it('returns true when no sprite body is available (safe default)', () => {
            mockGameObject.sprite = { body: null };
            expect(ai.hasGroundAhead(1)).toBe(true);
        });

        it('returns true when platforms group is not available (safe default)', () => {
            mockGameObject.sprite = makeSpriteWithBody(0, 0);
            mockGameObject.scene  = { platforms: null };
            expect(ai.hasGroundAhead(1)).toBe(true);
        });
    });

    describe('chaseTarget – ledge detection', () => {
        function attachSpriteAndPlatforms(groundAheadRight = true, groundAheadLeft = true) {
            // We mock hasGroundAhead so we can control the outcome without needing
            // real physics coordinates.
            jest.spyOn(ai, 'hasGroundAhead')
                .mockImplementation((dir) => (dir === 1 ? groundAheadRight : groundAheadLeft));
        }

        it('moves right normally when ground exists ahead', () => {
            ai.detectionRange = 800;
            mockGameObject.getPosition.mockReturnValue({ x: 0, y: 0 });
            mockTarget.getPosition.mockReturnValue({ x: 100, y: 0 });
            attachSpriteAndPlatforms(true, true);

            ai.update(16);

            expect(mockMovement.moveRight).toHaveBeenCalled();
            expect(mockMovement.stopHorizontal).not.toHaveBeenCalled();
        });

        it('stops at ledge when no ground ahead and target is not below', () => {
            ai.detectionRange = 800;
            mockGameObject.getPosition.mockReturnValue({ x: 0, y: 0 });
            // Target is to the right and at the same height — not below the ledge
            mockTarget.getPosition.mockReturnValue({ x: 200, y: 0 });
            mockMovement.isOnGround.mockReturnValue(true);
            attachSpriteAndPlatforms(false, true); // no ground to the right

            ai.update(16);

            expect(mockMovement.stopHorizontal).toHaveBeenCalled();
            expect(mockMovement.moveRight).not.toHaveBeenCalled();
        });

        it('walks off ledge when target is significantly below (chasing down)', () => {
            ai.detectionRange = 800;
            mockGameObject.getPosition.mockReturnValue({ x: 0, y: 0 });
            // Target is 150px below — enemy should follow
            mockTarget.getPosition.mockReturnValue({ x: 200, y: 150 });
            mockMovement.isOnGround.mockReturnValue(true);
            attachSpriteAndPlatforms(false, true);

            ai.update(16);

            expect(mockMovement.moveRight).toHaveBeenCalled();
        });

        it('does not apply ledge detection while airborne', () => {
            ai.detectionRange = 800;
            mockGameObject.getPosition.mockReturnValue({ x: 0, y: 0 });
            mockTarget.getPosition.mockReturnValue({ x: 200, y: 0 });
            mockMovement.isOnGround.mockReturnValue(false); // in the air
            attachSpriteAndPlatforms(false, true);

            ai.update(16);

            // Should still move right even though hasGroundAhead would return false,
            // because ledge check is skipped when airborne.
            expect(mockMovement.moveRight).toHaveBeenCalled();
        });
    });
});
