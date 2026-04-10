import InputComponent from '../components/InputComponent';

describe('InputComponent', () => {
    let input;

    beforeEach(() => {
        input = new InputComponent();
    });

    it('maps input keys to actions', () => {
        input.mapInput('left', 'moveLeft');
        expect(input.inputMap.get('left')).toBe('moveLeft');
    });

    it('registers and triggers action callbacks', () => {
        const cb = jest.fn();
        input.onAction('jump', cb);
        input.triggerAction('jump', true);
        expect(cb).toHaveBeenCalledWith(true);
    });

    it('processInput triggers mapped actions', () => {
        const cb = jest.fn();
        input.mapInput('right', 'moveRight');
        input.onAction('moveRight', cb);
        input.processInput({ right: true });
        expect(cb).toHaveBeenCalledWith(true);
    });

    it('processInput does nothing if disabled', () => {
        input.enabled = false;
        const cb = jest.fn();
        input.mapInput('attack', 'attack');
        input.onAction('attack', cb);
        input.processInput({ attack: true });
        expect(cb).not.toHaveBeenCalled();
    });

    it('getCurrentInput returns last input state', () => {
        input.processInput({ left: true, jump: false });
        expect(input.getCurrentInput()).toEqual({ left: true, jump: false });
    });

    it('clearMappings removes all input mappings', () => {
        input.mapInput('left', 'moveLeft');
        input.clearMappings();
        expect(input.inputMap.size).toBe(0);
    });

    it('clearCallbacks removes all action callbacks', () => {
        input.onAction('jump', jest.fn());
        input.clearCallbacks();
        expect(input.actionCallbacks.size).toBe(0);
    });
});
