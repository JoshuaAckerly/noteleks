/**
 * Base Component class - provides common functionality for all components
 */
class Component {
    constructor() {
        this.gameObject = null;
        this.enabled = true;
    }

    /**
     * Called when component is attached to a game object
     */
    onAttach() {
        // Override in subclasses if needed
    }

    /**
     * Called when component is detached from a game object
     */
    onDetach() {
        // Override in subclasses if needed
    }

    /**
     * Update component - called every frame
     * @param {number} deltaTime - Time since last frame in milliseconds
     */
    update(_deltaTime) {
        // Override in subclasses if needed
    }

    /**
     * Enable/disable this component
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * Check if component is enabled
     */
    isEnabled() {
        return this.enabled;
    }
}

export default Component;
