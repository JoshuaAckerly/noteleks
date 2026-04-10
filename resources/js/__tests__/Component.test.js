import Component from '../core/Component';

describe('Component', () => {
    let component;

    beforeEach(() => {
        component = new Component();
    });

    it('initializes with correct defaults', () => {
        expect(component.gameObject).toBeNull();
        expect(component.enabled).toBe(true);
    });

    it('can be enabled and disabled', () => {
        component.setEnabled(false);
        expect(component.enabled).toBe(false);
        expect(component.isEnabled()).toBe(false);
        component.setEnabled(true);
        expect(component.enabled).toBe(true);
        expect(component.isEnabled()).toBe(true);
    });

    it('onAttach and onDetach do not throw by default', () => {
        expect(() => component.onAttach()).not.toThrow();
        expect(() => component.onDetach()).not.toThrow();
    });

    it('update does not throw by default', () => {
        expect(() => component.update(16)).not.toThrow();
    });
});
