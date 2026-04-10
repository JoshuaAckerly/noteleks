import PhysicsComponent from '../components/PhysicsComponent';

describe('PhysicsComponent', () => {
    let physics;
    let mockGameObject;
    let mockSprite;
    let mockScene;
    let mockBody;

    beforeEach(() => {
        mockBody = {
            setBounce: jest.fn(),
            setCollideWorldBounds: jest.fn(),
            setSize: jest.fn(),
            setOffset: jest.fn(),
            setVelocity: jest.fn(),
            setVelocityX: jest.fn(),
            setVelocityY: jest.fn(),
            velocity: { x: 0, y: 0 },
            touching: { down: false, up: false, left: false, right: false },
        };
        mockSprite = { body: mockBody };
        mockScene = { physics: { add: { existing: jest.fn() } } };
        mockGameObject = { sprite: mockSprite, scene: mockScene };
        physics = new PhysicsComponent({
            bounce: 0.5,
            collideWorldBounds: true,
            bodyWidth: 10,
            bodyHeight: 20,
            bodyOffsetX: 1,
            bodyOffsetY: 2,
            isStatic: false,
        });
        physics.gameObject = mockGameObject;
        physics.onAttach();
    });

    it('sets up physics properties on attach', () => {
        expect(mockBody.setBounce).toHaveBeenCalledWith(0.5);
        expect(mockBody.setCollideWorldBounds).toHaveBeenCalledWith(true);
        expect(mockBody.setSize).toHaveBeenCalledWith(10, 20);
        expect(mockBody.setOffset).toHaveBeenCalledWith(1, 2);
    });

    it('setVelocity calls body.setVelocity', () => {
        physics.setVelocity(5, 6);
        expect(mockBody.setVelocity).toHaveBeenCalledWith(5, 6);
    });

    it('setVelocityX calls body.setVelocityX', () => {
        physics.setVelocityX(7);
        expect(mockBody.setVelocityX).toHaveBeenCalledWith(7);
    });

    it('setVelocityY calls body.setVelocityY', () => {
        physics.setVelocityY(8);
        expect(mockBody.setVelocityY).toHaveBeenCalledWith(8);
    });

    it('getVelocity returns body velocity', () => {
        mockBody.velocity = { x: 11, y: 22 };
        expect(physics.getVelocity()).toEqual({ x: 11, y: 22 });
    });

    it('isTouchingDown/Up/Left/Right return correct values', () => {
        mockBody.touching = { down: true, up: false, left: true, right: false };
        expect(physics.isTouchingDown()).toBe(true);
        expect(physics.isTouchingUp()).toBe(false);
        expect(physics.isTouchingLeft()).toBe(true);
        expect(physics.isTouchingRight()).toBe(false);
    });

    it('setBodySize and setBodyOffset call body methods', () => {
        physics.setBodySize(33, 44);
        expect(mockBody.setSize).toHaveBeenCalledWith(33, 44);
        physics.setBodyOffset(2, 3);
        expect(mockBody.setOffset).toHaveBeenCalledWith(2, 3);
    });

    it('getBody returns the body', () => {
        expect(physics.getBody()).toBe(mockBody);
    });
});
