/**
 * Base GameObject class - provides common functionality for all game objects
 */
class GameObject {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.sprite = null;
        this.isDestroyed = false;
        this.components = new Map();
    }

    /**
     * Create the visual representation of this game object
     * Must be implemented by subclasses
     */
    create() {
        throw new Error('GameObject.create() must be implemented by subclasses');
    }

    /**
     * Update this game object - called every frame
     * @param {number} deltaTime - Time since last frame in milliseconds
     */
    update(deltaTime) {
        // Update all components
        for (const component of this.components.values()) {
            if (component.update) {
                component.update(deltaTime);
            }
        }
    }

    /**
     * Add a component to this game object
     * @param {string} name - Component name
     * @param {Component} component - Component instance
     */
    addComponent(name, component) {
        component.gameObject = this;
        this.components.set(name, component);

        if (component.onAttach) {
            component.onAttach();
        }
    }

    /**
     * Get a component by name
     * @param {string} name - Component name
     * @returns {Component|null}
     */
    getComponent(name) {
        return this.components.get(name) || null;
    }

    /**
     * Remove a component by name
     * @param {string} name - Component name
     */
    removeComponent(name) {
        const component = this.components.get(name);
        if (component) {
            if (component.onDetach) {
                component.onDetach();
            }
            this.components.delete(name);
        }
    }

    /**
     * Get the sprite for physics and rendering
     */
    getSprite() {
        return this.sprite;
    }

    /**
     * Get current position
     */
    getPosition() {
        return this.sprite ? { x: this.sprite.x, y: this.sprite.y } : { x: this.x, y: this.y };
    }

    /**
     * Set position
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        if (this.sprite) {
            this.sprite.setPosition(x, y);
        }
    }

    /**
     * Destroy this game object and clean up resources
     */
    destroy() {
        if (this.isDestroyed) return;

        // Destroy all components
        for (const component of this.components.values()) {
            if (component.onDetach) {
                component.onDetach();
            }
        }
        this.components.clear();

        // Destroy sprite
        if (this.sprite && this.sprite.destroy) {
            this.sprite.destroy();
        }

        this.isDestroyed = true;
    }
}

export default GameObject;
