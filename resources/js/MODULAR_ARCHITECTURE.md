# Noteleks Heroes Beyond Light - Modular Architecture

## Overview

This refactored version of the game implements a modular, maintainable architecture that separates concerns and improves code organization.

## Architecture

```
noteleks/
├── config/                 # Configuration files
│   └── GameConfig.js       # Central game configuration
├── core/                   # Core game framework
│   ├── GameObject.js       # Base game object class
│   ├── Component.js        # Base component class
│   └── Interfaces.js       # Type interfaces
├── components/             # Reusable game components
│   ├── AIComponent.js      # AI behavior
│   ├── MovementComponent.js # Movement & physics
│   ├── HealthComponent.js  # Health management
│   ├── InputComponent.js   # Input handling
│   ├── AttackComponent.js  # Attack mechanics
│   └── PhysicsComponent.js # Physics integration
├── entities/               # Game entities
│   ├── Player.js          # Player entity
│   └── Enemy.js           # Enemy entity
├── managers/               # System managers
│   ├── EnemyManager.js    # Enemy spawning & lifecycle
│   ├── InputManager.js    # Input management
│   └── PlatformManager.js # Platform/terrain management
├── systems/                # Game systems
│   └── SystemManager.js   # Coordinates all systems
├── factories/              # Object factories
│   └── GameObjectFactory.js # Creates game objects
├── scenes/                 # Game scenes
│   └── GameScene.js       # Main game scene (refactored)
├── utils/                  # Utility modules
│   ├── AssetManager.js    # Asset loading utilities
│   └── GameUtils.js       # Math, state, input utilities
├── main-modular.js        # Modular entry point
└── NoteleksGameModular.js # Main game class
```

## Key Features

### 1. Configuration-Driven Design

All game settings are centralized in `GameConfig.js`:

```javascript
import GameConfig from './config/GameConfig.js';

// Access player settings
const playerSpeed = GameConfig.player.speed;

// Access enemy configurations
const zombieConfig = GameConfig.enemies.types.zombie;
```

### 2. Modular Managers

Each game system is managed by a dedicated manager:

- **EnemyManager**: Handles enemy spawning, AI coordination, and lifecycle
- **InputManager**: Centralizes input handling with clean interface
- **PlatformManager**: Manages terrain and platform creation

### 3. Component-Based Entities

Entities use composition over inheritance:

```javascript
// Player with components
class Player extends GameObject {
    setupComponents() {
        this.addComponent('movement', new MovementComponent());
        this.addComponent('health', new HealthComponent());
        this.addComponent('input', new InputComponent());
        this.addComponent('attack', new AttackComponent());
    }
}
```

### 4. Utility Modules

Common functionality is extracted into utility modules:

- **AssetManager**: Asset loading and management
- **MathUtils**: Mathematical operations
- **GameStateUtils**: Game state management
- **InputUtils**: Input processing utilities

## Usage

### Basic Usage

```javascript
import NoteleksGame from './NoteleksGameModular.js';

// Create and initialize the game
const game = NoteleksGame.create('game-container');
```

### Advanced Usage

```javascript
import NoteleksGame from './NoteleksGameModular.js';
import GameConfig from './config/GameConfig.js';

// Modify configuration before initialization
GameConfig.player.speed = 200;
GameConfig.enemies.spawnInterval = 2000;

// Create game with custom settings
const game = new NoteleksGame();
game.initialize('my-game-container');

// Access game systems
const scene = game.getScene('GameScene');
const enemyCount = scene.enemyManager.getEnemyCount();
```

## Benefits

### Maintainability

- Clear separation of concerns
- Single responsibility principle
- Easy to modify and extend

### Modularity

- Reusable components
- Independent managers
- Pluggable architecture

### Configuration

- Centralized settings
- Easy to balance gameplay
- Environment-specific configs

### Testing

- Isolated modules
- Mockable dependencies
- Clear interfaces

## Migration Guide

### From Legacy to Modular

1. **Replace main import**:

    ```javascript
    // Old
    import './main.js';

    // New
    import './main-modular.js';
    ```

2. **Update configuration**:

    ```javascript
    // Old: Hard-coded values
    const speed = 160;

    // New: Configuration-driven
    const speed = GameConfig.player.speed;
    ```

3. **Use managers**:

    ```javascript
    // Old: Direct management
    this.spawnEnemy();

    // New: Manager-based
    this.enemyManager.spawnEnemy();
    ```

## Extension Points

### Adding New Components

```javascript
// Create new component
class ShieldComponent extends Component {
    constructor(strength) {
        super();
        this.strength = strength;
    }
}

// Add to entities
player.addComponent('shield', new ShieldComponent(100));
```

### Adding New Managers

```javascript
// Create new manager
class PowerUpManager {
    constructor(scene) {
        this.scene = scene;
    }

    initialize() {
        // Setup power-up spawning
    }
}

// Register in scene
this.powerUpManager = new PowerUpManager(this);
```

### Extending Configuration

```javascript
// Add to GameConfig.js
export const GameConfig = {
    // ... existing config
    powerUps: {
        spawnRate: 10000,
        types: {
            health: { healing: 25 },
            speed: { boost: 50, duration: 5000 },
        },
    },
};
```

## Performance Considerations

- Managers update only what's necessary
- Component systems allow for efficient iteration
- Configuration prevents repeated calculations
- Asset manager optimizes loading

## Best Practices

1. **Use configuration for all tunable values**
2. **Keep managers focused on single responsibilities**
3. **Prefer composition over inheritance**
4. **Use utilities for common operations**
5. **Document extension points**
6. **Test managers independently**

This modular architecture provides a solid foundation for future development and makes the codebase much more maintainable and extensible.
