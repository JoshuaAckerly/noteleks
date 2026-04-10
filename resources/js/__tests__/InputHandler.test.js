import InputHandler from '../managers/InputHandler.js';
import { GameConfig } from '../config/GameConfig.js';

function createMockScene(extra = {}) {
    return {
        input: { keyboard: { addKeys: jest.fn(() => ({})) } },
        gameState: 'playing',
        inputManager: null,
        ...extra,
    };
}

describe('InputHandler', () => {
    it('should construct with a scene', () => {
        const mockScene = createMockScene();
        const handler = new InputHandler(mockScene);
        expect(handler.scene).toBe(mockScene);
    });

    it('should set up keys', () => {
        const mockScene = {
            input: { keyboard: { addKeys: jest.fn(() => ({ W: {}, S: {}, A: {}, D: {} })) } },
        };
        const handler = new InputHandler(mockScene);
        handler.setupKeys();
        expect(mockScene.input.keyboard.addKeys).toHaveBeenCalled();
    });

    it('initializes _coyoteTime from GameConfig', () => {
        const handler = new InputHandler(createMockScene());
        expect(handler._coyoteTime).toBe(GameConfig.player.coyoteTime);
    });

    it('initializes _jumpBuffer from GameConfig', () => {
        const handler = new InputHandler(createMockScene());
        expect(handler._jumpBuffer).toBe(GameConfig.player.jumpBuffer);
    });

    it('_lastGroundedTime defaults to 0', () => {
        const handler = new InputHandler(createMockScene());
        expect(handler._lastGroundedTime).toBe(0);
    });

    it('_jumpBufferTime defaults to 0', () => {
        const handler = new InputHandler(createMockScene());
        expect(handler._jumpBufferTime).toBe(0);
    });

    describe('processPlayerInput', () => {
        function createMockPlayer() {
            return {
                sprite: {
                    body: {
                        setVelocityX: jest.fn(),
                        setVelocityY: jest.fn(),
                    },
                    setFlipX: jest.fn(),
                },
                getComponent: jest.fn(() => null),
                playAnimation: jest.fn(),
            };
        }

        function stubPhysicsManager(handler, { onGround = false } = {}) {
            handler.physicsManager = {
                setVelocityX: jest.fn(),
                setVelocityY: jest.fn(),
                isTouchingDown: jest.fn(() => onGround),
            };
        }

        it('updates _lastGroundedTime when player is on ground', () => {
            const handler = new InputHandler(createMockScene());
            stubPhysicsManager(handler, { onGround: true });
            const before = Date.now();
            handler.processPlayerInput(createMockPlayer(), { left: false, right: false, up: false, down: false, attack: false });
            expect(handler._lastGroundedTime).toBeGreaterThanOrEqual(before);
        });

        it('does not update _lastGroundedTime when airborne', () => {
            const handler = new InputHandler(createMockScene());
            stubPhysicsManager(handler, { onGround: false });
            handler._lastGroundedTime = 0;
            handler.processPlayerInput(createMockPlayer(), { left: false, right: false, up: false, down: false, attack: false });
            expect(handler._lastGroundedTime).toBe(0);
        });

        it('records _jumpBufferTime when jump key just pressed', () => {
            const handler = new InputHandler(createMockScene());
            stubPhysicsManager(handler, { onGround: false });
            handler.lastJumpKeyState = false;
            handler._jumpBufferTime = 0;
            const before = Date.now();
            handler.processPlayerInput(createMockPlayer(), { left: false, right: false, up: true, down: false, attack: false });
            expect(handler._jumpBufferTime).toBeGreaterThanOrEqual(before);
        });

        it('does not update _jumpBufferTime when jump key held (not a fresh press)', () => {
            const handler = new InputHandler(createMockScene());
            stubPhysicsManager(handler, { onGround: false });
            handler.lastJumpKeyState = true; // key was already held last frame
            handler._jumpBufferTime = 0;
            handler.processPlayerInput(createMockPlayer(), { left: false, right: false, up: true, down: false, attack: false });
            expect(handler._jumpBufferTime).toBe(0);
        });
    });

    describe('getInputState', () => {
        it('merges touch left when scene has inputManager.getTouchState', () => {
            const touchScene = createMockScene({
                inputManager: {
                    getTouchState: jest.fn(() => ({ left: true, right: false, jump: false, down: false, attack: false })),
                },
            });
            const handler = new InputHandler(touchScene);
            // Give the handler real key objects so isDown works
            handler.keys = {
                LEFT: { isDown: false }, RIGHT: { isDown: false },
                UP: { isDown: false }, DOWN: { isDown: false },
                A: { isDown: false }, D: { isDown: false },
                W: { isDown: false }, S: { isDown: false },
                SPACE: { isDown: false },
            };
            const state = handler.getInputState();
            expect(state.left).toBe(true);
        });

        it('returns keyboard state when no touch inputManager is present', () => {
            const handler = new InputHandler(createMockScene());
            handler.keys = {
                LEFT: { isDown: true }, RIGHT: { isDown: false },
                UP: { isDown: false }, DOWN: { isDown: false },
                A: { isDown: false }, D: { isDown: false },
                W: { isDown: false }, S: { isDown: false },
                SPACE: { isDown: false },
            };
            const state = handler.getInputState();
            expect(state.left).toBe(true);
            expect(state.right).toBe(false);
        });
    });
});
