import AttackComponent from '../components/AttackComponent';

describe('AttackComponent', () => {
    let attack;
    let mockGameObject;
    let mockMovement;

    beforeEach(() => {
        mockMovement = { getFacing: jest.fn().mockReturnValue('left') };
        mockGameObject = { getComponent: jest.fn().mockImplementation((name) => (name === 'movement' ? mockMovement : null)) };
        attack = new AttackComponent(100, 10);
        attack.gameObject = mockGameObject;
        jest.spyOn(Date, 'now').mockReturnValue(1000);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('initializes with correct values', () => {
        expect(attack.attackCooldown).toBe(100);
        expect(attack.damage).toBe(10);
        expect(attack.isAttacking).toBe(false);
    });

    it('canAttack returns true if not attacking and cooldown passed', () => {
        attack.isAttacking = false;
        attack.lastAttackTime = 800;
        expect(attack.canAttack()).toBe(true);
    });

    it('canAttack returns false if attacking or cooldown not passed', () => {
        attack.isAttacking = true;
        expect(attack.canAttack()).toBe(false);
        attack.isAttacking = false;
        attack.lastAttackTime = 950;
        expect(attack.canAttack()).toBe(false);
    });

    it('attack triggers callbacks and sets state', () => {
        const cb = jest.fn();
        attack.onAttack(cb);
        expect(attack.attack()).toBe(true);
        expect(attack.isAttacking).toBe(true);
        expect(attack.lastAttackTime).toBe(1000);
        expect(cb).toHaveBeenCalledWith(null, 'left', 10);
    });

    it('attack returns false if cannot attack', () => {
        attack.isAttacking = true;
        expect(attack.attack()).toBe(false);
    });

    it('update resets isAttacking after cooldown', () => {
        attack.isAttacking = true;
        attack.lastAttackTime = 800;
        jest.spyOn(Date, 'now').mockReturnValue(1000);
        attack.update(16);
        expect(attack.isAttacking).toBe(false);
    });

    it('isCurrentlyAttacking returns isAttacking', () => {
        attack.isAttacking = true;
        expect(attack.isCurrentlyAttacking()).toBe(true);
    });

    it('getRemainingCooldown returns correct value', () => {
        attack.lastAttackTime = 800;
        attack.attackCooldown = 300;
        jest.spyOn(Date, 'now').mockReturnValue(1000);
        expect(attack.getRemainingCooldown()).toBe(100);
    });

    it('setDamage and getDamage work', () => {
        attack.setDamage(42);
        expect(attack.getDamage()).toBe(42);
    });

    it('setCooldown updates attackCooldown', () => {
        attack.setCooldown(555);
        expect(attack.attackCooldown).toBe(555);
    });

    it('reset clears attack state', () => {
        attack.isAttacking = true;
        attack.lastAttackTime = 1234;
        attack.reset();
        expect(attack.isAttacking).toBe(false);
        expect(attack.lastAttackTime).toBe(0);
    });
});
