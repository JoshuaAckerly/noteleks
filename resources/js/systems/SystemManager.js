/**
 * System Manager - coordinates all game systems and their interactions
 */
class SystemManager {
    constructor(scene) {
        this.scene = scene;
        this.systems = new Map();
        this.gameObjects = new Set();
        this.isRunning = false;
    }

    /**
     * Register a system
     * @param {string} name - System name
     * @param {Object} system - System instance
     */
    registerSystem(name, system) {
        this.systems.set(name, system);

        // Initialize system if manager is already running
        if (this.isRunning && system.initialize) {
            system.initialize();
        }
    }

    /**
     * Get a system by name
     * @param {string} name - System name
     */
    getSystem(name) {
        return this.systems.get(name);
    }

    /**
     * Add a game object to be managed
     * @param {GameObject} gameObject - Game object to add
     */
    addGameObject(gameObject) {
        this.gameObjects.add(gameObject);
    }

    /**
     * Remove a game object from management
     * @param {GameObject} gameObject - Game object to remove
     */
    removeGameObject(gameObject) {
        this.gameObjects.delete(gameObject);

        // Clean up destroyed objects
        if (gameObject.isDestroyed) {
            gameObject.destroy();
        }
    }

    /**
     * Initialize all systems
     */
    initialize() {
        this.isRunning = true;

        for (const system of this.systems.values()) {
            if (system.initialize) {
                system.initialize();
            }
        }
    }

    /**
     * Update all systems and game objects
     * @param {number} deltaTime - Time since last frame
     */
    update(deltaTime) {
        if (!this.isRunning) return;

        // Update all systems
        for (const system of this.systems.values()) {
            if (system.update) {
                system.update(deltaTime);
            }
        }

        // Update all game objects
        for (const gameObject of this.gameObjects) {
            if (!gameObject.isDestroyed) {
                gameObject.update(deltaTime);
            }
        }

        // Clean up destroyed objects
        this.cleanupDestroyedObjects();
    }

    /**
     * Clean up destroyed game objects
     */
    cleanupDestroyedObjects() {
        const destroyedObjects = [];

        for (const gameObject of this.gameObjects) {
            if (gameObject.isDestroyed) {
                destroyedObjects.push(gameObject);
            }
        }

        destroyedObjects.forEach((obj) => {
            this.removeGameObject(obj);
        });
    }

    /**
     * Pause all systems
     */
    pause() {
        this.isRunning = false;

        for (const system of this.systems.values()) {
            if (system.pause) {
                system.pause();
            }
        }
    }

    /**
     * Resume all systems
     */
    resume() {
        this.isRunning = true;

        for (const system of this.systems.values()) {
            if (system.resume) {
                system.resume();
            }
        }
    }

    /**
     * Shutdown all systems
     */
    shutdown() {
        this.isRunning = false;

        // Shutdown all systems
        for (const system of this.systems.values()) {
            if (system.shutdown) {
                system.shutdown();
            }
        }

        // Destroy all game objects
        for (const gameObject of this.gameObjects) {
            gameObject.destroy();
        }

        // Clear collections
        this.systems.clear();
        this.gameObjects.clear();
    }

    /**
     * Get all game objects of a specific type
     * @param {Function} constructor - Constructor function to check against
     */
    getGameObjectsByType(constructor) {
        const result = [];
        for (const gameObject of this.gameObjects) {
            if (gameObject instanceof constructor) {
                result.push(gameObject);
            }
        }
        return result;
    }

    /**
     * Get all game objects with a specific component
     * @param {string} componentName - Component name
     */
    getGameObjectsWithComponent(componentName) {
        const result = [];
        for (const gameObject of this.gameObjects) {
            if (gameObject.getComponent(componentName)) {
                result.push(gameObject);
            }
        }
        return result;
    }

    /**
     * Execute a function on all game objects with a specific component
     * @param {string} componentName - Component name
     * @param {Function} callback - Function to execute
     */
    forEachGameObjectWithComponent(componentName, callback) {
        for (const gameObject of this.gameObjects) {
            const component = gameObject.getComponent(componentName);
            if (component) {
                callback(gameObject, component);
            }
        }
    }
}

export default SystemManager;
