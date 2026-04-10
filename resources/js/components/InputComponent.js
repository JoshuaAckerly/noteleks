import Component from '../core/Component.js';

/**
 * Input component - handles input processing for game objects
 */
class InputComponent extends Component {
    constructor() {
        super();
        this.inputMap = new Map();
        this.actionCallbacks = new Map();
        this.currentInput = {};
    }

    onAttach() {
        // Input will be processed externally and fed to this component
    }

    /**
     * Map an input key to an action
     * @param {string} key - Key name (e.g., 'left', 'right', 'jump', 'attack')
     * @param {string} action - Action name
     */
    mapInput(key, action) {
        this.inputMap.set(key, action);
    }

    /**
     * Add callback for an action
     * @param {string} action - Action name
     * @param {Function} callback - Callback function
     */
    onAction(action, callback) {
        if (!this.actionCallbacks.has(action)) {
            this.actionCallbacks.set(action, []);
        }
        this.actionCallbacks.get(action).push(callback);
    }

    /**
     * Process input state
     * @param {Object} inputState - Current input state
     */
    processInput(inputState) {
        if (!this.enabled) return;

        // Store current input state
        this.currentInput = { ...inputState };

        // Process each mapped input
        for (const [key, action] of this.inputMap) {
            if (inputState[key]) {
                this.triggerAction(action, inputState[key]);
            }
        }
    }

    /**
     * Get current input state
     * @returns {Object} Current input state
     */
    getCurrentInput() {
        return this.currentInput;
    }

    /**
     * Trigger an action
     * @param {string} action - Action name
     * @param {*} value - Action value (true/false for buttons, pointer data for mouse, etc.)
     */
    triggerAction(action, value) {
        const callbacks = this.actionCallbacks.get(action);
        if (callbacks) {
            callbacks.forEach((callback) => callback(value));
        }
    }

    /**
     * Clear all input mappings
     */
    clearMappings() {
        this.inputMap.clear();
    }

    /**
     * Clear all action callbacks
     */
    clearCallbacks() {
        this.actionCallbacks.clear();
    }
}

export default InputComponent;
