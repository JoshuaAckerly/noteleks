# Noteleks Heroes - Phaser 3 Game

> A 2D action platformer built with Phaser 3 and WebP frame animations

## 🎮 Current Implementation

### Technology Stack

- **Phaser 3.70.0** - Game engine
- **WebP Animations** - 356x356 pixel frame-based animations (weaponless skeleton)
- **AnimationManager** - Extracted animation logic from Player class
- **Component-Based Architecture** - Modular entity system
- **Direct Asset Loading** - No manifest dependency

### Game Features

- **Player Character**: Animated skeleton (no weapon) with idle, run, attack, and jump states
- **Physics System**: Character-sized collision box (60x100) positioned on skeleton body
- **Attack System**: Melee hitbox with 500ms cooldown, knockback effects, positioned at hand level
- **Combat System**: Enemy knockback on hit, increased health values, hit tracking per attack
- **Enemy System**: Working AI with multiple enemy types (zombie, skeleton, ghost, boss)
- **Score System**: Points awarded for defeating enemies
- **Input Controls**: WASD/Arrow keys for movement, Space for attack
- **Debug Mode**: Visual collision boundaries (green outlines)

## 📁 Project Structure

```
noteleks/
├── main-modular.js              # Entry point
├── NoteleksGameModular.js       # Main game class
├── config/
│   └── GameConfig.js           # Game configuration
├── entities/
│   └── Player.js               # Player entity with simplified controls
├── components/
│   ├── HealthComponent.js      # Health management
│   ├── MovementComponent.js    # Physics movement
│   ├── InputComponent.js       # Input handling
│   ├── AttackComponent.js      # Combat system
│   └── PhysicsComponent.js     # Physics body setup
├── managers/
│   ├── EnemyManager.js         # Enemy spawning
│   ├── InputManager.js         # Input coordination
│   └── PlatformManager.js      # Platform generation
├── scenes/
│   ├── GameScene.js            # Main gameplay scene
│   └── LoadingScene.js         # Asset loading with animation creation
└── utils/
    └── AssetManagerSimple.js   # Simplified asset management
```

## 🎯 Animation System

### WebP Frame Structure (Weaponless Skeleton)

- **Skeleton-Idle**: 16 frames (00-15) - 8 FPS, loops
- **Skeleton-Run**: 16 frames (00-15) - 12 FPS, loops
- **Skeleton-Attack1**: 3 frames (0-2) - 8 FPS, no loop (hand motion only)
- **Skeleton-Jump**: 1 frame (0) - Static pose
- **Skeleton-JumpAttack**: 8 frames (0-7) - For future use

### Animation Architecture

1. **LoadingScene** loads individual WebP files directly
2. **createAnimations()** builds Phaser animations from loaded frames
3. **AnimationManager** handles sprite animation logic (extracted from Player)
4. **Player** delegates to AnimationManager for cleaner separation

## ⚙️ Configuration

### Player Settings (GameConfig.js)

```javascript
player: {
    startPosition: { x: 400, y: 300 },
    speed: 160,           // Movement speed
    jumpPower: 330,       // Jump velocity
    scale: 0.3,          // Sprite scale (356x356 → ~107x107)
    health: 100,
    maxHealth: 100
}
```

### Physics Settings

```javascript
physics: {
    gravity: { x: 0, y: 300 },
    debug: true          // Shows collision boundaries
}
```

## 🎮 Controls

- **A/D or Left/Right Arrow**: Move left/right
- **W or Up Arrow**: Jump
- **Space**: Attack (working with knockback)
- **Escape**: Return to home page

## 🔧 Development Setup

### Asset Requirements

- WebP animation frames in `/public/games/noteleks/sprites/`
- Naming convention: `Skeleton-[Action]_[FrameNumber].webp`
- Current size: 356x356 pixels per frame (weaponless skeleton)
- **Next**: Separate weapon sprites for attachment system

### Running the Game

1. Navigate to `https://studio.test/noteleks`
2. Game loads automatically through Vite dev server
3. Debug mode shows green collision boundaries

## 🏗️ Architecture Details

### Entity-Component System

- **GameObject**: Base class with component management
- **Components**: Modular behaviors (Health, Movement, Physics, etc.)
- **Player**: Main entity using simplified direct input controls

### Simplified Input System

```javascript
// Direct keyboard input in Player.update()
const keys = this.scene.input.keyboard.addKeys('W,S,A,D,UP,DOWN,LEFT,RIGHT');

if (keys.LEFT.isDown || keys.A.isDown) {
    this.sprite.body.setVelocityX(-160);
    this.playAnimation('run', true);
}
```

### Physics Body Configuration

- **Visual Size**: 356x356 scaled to ~107x107 pixels
- **Collision Body**: 60x100 pixels, centered on character
- **Body Offset**: (48, 120) to align with character sprite

## 🐛 Current Status

### ✅ Working Features

- Player movement and jumping with direct keyboard controls
- WebP frame animations (idle, run, jump, attack)
- Physics collision with world bounds and character-sized collision box
- Attack system with melee hitbox and enemy knockback
- Enemy spawning system with AI behavior
- Enemy health system with balanced values (zombie: 5, skeleton: 7, ghost: 4, boss: 15)
- Score system with points for defeating enemies
- Hit tracking system preventing multiple hits per attack
- Debug visualization of collision boxes
- Proper scaling and positioning

### 🔄 Recent Changes

- Removed Spine animation system dependency
- Simplified to direct WebP frame loading
- Streamlined player input controls to direct keyboard handling
- Fixed physics body sizing issues (60x100 collision box)
- Removed manifest.json dependency
- Implemented working enemy system with AI
- Added score system and hit tracking
- Extracted AnimationManager from Player class

### 🎯 Next Steps

- Implement separate weapon system (spear attachment)
- Create platform/level geometry with jumpable heights
- Add sound effects and music
- Implement game UI (health bar, better score display)
- Add particle effects for combat feedback

## 📝 Technical Notes

### Animation Frame Loading

```javascript
// LoadingScene loads frames directly
for (let i = 0; i <= 15; i++) {
    const frameNum = i.toString().padStart(2, '0');
    this.load.image(`skeleton-idle-${i}`, `/games/noteleks/sprites/Skeleton-Idle_${frameNum}.webp`);
}

// Creates Phaser animation
this.anims.create({
    key: 'player-idle',
    frames: idleFrames,
    frameRate: 8,
    repeat: -1,
});
```

### Physics Body Setup

```javascript
// Set collision body smaller than visual sprite
this.sprite.body.setSize(60, 100); // Collision size
this.sprite.body.setOffset(48, 120); // Center on character
this.sprite.body.setCollideWorldBounds(true); // Stay in game area
```

## 🎨 Asset Guidelines

### WebP Frame Specifications

- **Resolution**: 356x356 pixels
- **Format**: WebP for optimal compression
- **Naming**: `Skeleton-[Action]_[Frame].webp`
- **Character Positioning**: Centered in frame for consistent scaling

### Animation Timing

- **Idle**: 8 FPS for subtle movement
- **Run**: 12 FPS for smooth motion
- **Attack**: 8 FPS for clear action frames
- **Jump**: Static frame, no animation needed

---

**Game URL**: https://studio.test/noteleks  
**Debug Mode**: Enabled by default (green collision outlines)  
**Framework**: Phaser 3.70.0 with WebGL rendering
