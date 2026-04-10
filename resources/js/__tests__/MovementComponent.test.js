import MovementComponent from '../components/MovementComponent';

describe('MovementComponent', () => {
    let movement;
    let mockGameObject;
    let mockSprite;
    let mockBody;

    beforeEach(() => {
        mockBody = {
            setVelocityX: jest.fn(),
            setVelocityY: jest.fn(),
            touching: { down: false },
        };
        mockSprite = {
            setFlipX: jest.fn(),
            body: mockBody,
        };
        mockGameObject = { sprite: mockSprite };
        movement = new MovementComponent(100, 200, 150, 2);
        movement.gameObject = mockGameObject;
        movement.onAttach();
    });

    it('initializes with correct defaults', () => {
        expect(movement.speed).toBe(100);
        expect(movement.jumpPower).toBe(200);
        expect(movement.doubleJumpPower).toBe(150);
        expect(movement.maxJumps).toBe(2);
        expect(movement.jumpsRemaining).toBe(2);
        expect(movement.facing).toBe('right');
    });

    it('moveLeft sets velocity and calls setVelocityX', () => {
        movement.moveLeft();
        expect(movement.velocityX).toBe(-100);
        expect(mockBody.setVelocityX).toHaveBeenCalledWith(-100);
    });

    it('moveRight sets velocity and calls setVelocityX', () => {
        movement.moveRight();
        expect(movement.velocityX).toBe(100);
        expect(mockBody.setVelocityX).toHaveBeenCalledWith(100);
    });

    it('stopHorizontal sets velocity to 0 and calls setVelocityX', () => {
        movement.stopHorizontal();
        expect(movement.velocityX).toBe(0);
        expect(mockBody.setVelocityX).toHaveBeenCalledWith(0);
    });

    it('jump works for max jumps and double jump', () => {
        mockBody.setVelocityY.mockClear();
        movement.jumpsRemaining = 2;
        expect(movement.jump()).toBe(true);
        expect(mockBody.setVelocityY).toHaveBeenCalledWith(-200);
        expect(movement.jumpsRemaining).toBe(1);
        expect(movement.jump()).toBe(true);
        expect(mockBody.setVelocityY).toHaveBeenCalledWith(-150);
        expect(movement.jumpsRemaining).toBe(0);
        expect(movement.jump()).toBe(false);
    });

    it('resetJumps restores jumpsRemaining', () => {
        movement.jumpsRemaining = 0;
        movement.resetJumps();
        expect(movement.jumpsRemaining).toBe(2);
    });

    it('getFacing returns correct direction', () => {
        movement.velocityX = 10;
        movement.update(16);
        expect(movement.getFacing()).toBe('right');
        movement.velocityX = -10;
        movement.update(16);
        expect(movement.getFacing()).toBe('left');
    });

    it('isMoving returns true if velocityX != 0', () => {
        movement.velocityX = 5;
        expect(movement.isMoving()).toBe(true);
        movement.velocityX = 0;
        expect(movement.isMoving()).toBe(false);
    });

    it('isOnGround returns correct value', () => {
        mockBody.touching.down = true;
        movement.update(16);
        expect(movement.isOnGround()).toBe(true);
        mockBody.touching.down = false;
        movement.update(16);
        expect(movement.isOnGround()).toBe(false);
    });

    it('update resets jumps when grounded', () => {
        movement.jumpsRemaining = 0;
        mockBody.touching.down = true;
        movement.update(16);
        expect(movement.jumpsRemaining).toBe(2);
    });

    it('update sets flipX based on direction', () => {
        movement.velocityX = 10;
        movement.update(16);
        expect(mockSprite.setFlipX).toHaveBeenCalledWith(false);
        movement.velocityX = -10;
        movement.update(16);
        expect(mockSprite.setFlipX).toHaveBeenCalledWith(true);
    });
});
