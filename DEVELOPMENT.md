# Noteleks - Browser-Based Game Development Guide

Noteleks is a browser-based game built with Laravel and Phaser.js, offering interactive gameplay directly in the web browser.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Local Development](#local-development)
- [Game Architecture](#game-architecture)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## 🎮 Overview

Noteleks is a web-based game that runs entirely in the browser using Phaser.js for game engine functionality and Laravel for backend support.

**Features**:
- Real-time browser gaming
- Multi-platform support (desktop, tablet, mobile)
- Game state persistence
- Responsive design
- User progress tracking

## 🛠 Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Backend** | Laravel 12 | Game logic, scoring, user management |
| **Game Engine** | Phaser.js | Browser game framework |
| **Frontend** | Blade templates | HTML rendering (no SSR) |
| **Styling** | Tailwind CSS 4 | Responsive UI |
| **Database** | MySQL | Game state and user data |
| **Build Tool** | Vite | Asset bundling |

## 🚀 Local Development

### Prerequisites

- PHP 8.2+
- Node.js 18+
- Composer
- MySQL 8.0+
- Web browser with WebGL support

### Setup

```bash
# Clone repository
git clone https://github.com/YOUR-USERNAME/noteleks.git
cd noteleks

# Install dependencies
composer install
npm install

# Environment setup
cp .env.example .env
php artisan key:generate

# Database
php artisan migrate

# Start development server
php artisan serve --port=8000

# In another terminal, start Vite dev server
npm run dev
```

### Development URLs

- **Game**: http://localhost:8000
- **Vite Dev Server**: http://localhost:8008

## 🎮 Game Architecture

### File Structure

```
resources/
├── js/
│   ├── games/
│   │   ├── scenes/
│   │   │   ├── MenuScene.js
│   │   │   ├── GameScene.js
│   │   │   ├── GameOverScene.js
│   │   │   └── PauseScene.js
│   │   ├── sprites/
│   │   │   ├── Player.js
│   │   │   ├── Enemy.js
│   │   │   └── Collectible.js
│   │   ├── physics/
│   │   │   └── Physics.js
│   │   ├── config/
│   │   │   └── GameConfig.js
│   │   └── Game.js
│   └── components/
│       ├── GameCanvas.tsx
│       └── UI/
└── views/
    └── game.blade.php
```

### Key Components

**Phaser Scenes**:
- MenuScene: Main menu and navigation
- GameScene: Primary gameplay
- GameOverScene: Game end and results
- PauseScene: Game pause menu

**Sprites**:
- Player: Main character/entity
- Enemy: Opposing entities
- Collectible: Pickup items

### Game Loop

```
Initialize Game
  ↓
Load Assets
  ↓
Create Scenes
  ↓
Start Game Loop
  ↓
Update (physics, collisions)
  ↓
Render
  ↓
Repeat
```

## 💻 Development

### Creating New Scenes

```javascript
// resources/js/games/scenes/NewScene.js
export class NewScene extends Phaser.Scene {
    constructor() {
        super('NewScene');
    }

    preload() {
        // Load assets
    }

    create() {
        // Initialize scene
    }

    update() {
        // Game loop updates
    }
}
```

### Adding Game Objects

```javascript
// In scene's create() method
const player = this.add.sprite(100, 100, 'player');
this.physics.add.existing(player);
player.body.setVelocity(100, 0);
```

### Input Handling

```javascript
// Keyboard input
this.input.keyboard.on('keydown-UP', () => {
    player.body.setVelocityY(-300);
});

// Mouse input
this.input.on('pointerdown', (pointer) => {
    // Handle click
});
```

### Collisions & Physics

```javascript
// Setup collisions
this.physics.add.collider(player, walls);
this.physics.add.overlap(player, collectibles, collectPickup, null, this);

// Collision callback
collectPickup(player, collectible) {
    collectible.destroy();
    score += 10;
}
```

## 🎯 Game Development Best Practices

1. **Asset Optimization**: Use compressed images and sprites
2. **Performance**: Use object pooling for many entities
3. **Mobile Support**: Test on various screen sizes
4. **Accessibility**: Provide keyboard and gamepad support
5. **Testing**: Test game mechanics thoroughly
6. **User Feedback**: Clear feedback on actions

## 📊 User Progress Tracking

### Save Game State

```php
// app/Services/GameService.php
public function saveProgress(User $user, array $gameData): void {
    UserGameProgress::updateOrCreate(
        ['user_id' => $user->id],
        [
            'score' => $gameData['score'],
            'level' => $gameData['level'],
            'progress' => $gameData['progress'],
            'last_played' => now(),
        ]
    );
}
```

### Load Game State

```javascript
// Fetch user progress from API
fetch('/api/game/progress')
    .then(r => r.json())
    .then(data => {
        gameState.score = data.score;
        gameState.level = data.level;
    });
```

## 🚀 Deployment

### Browser Compatibility

Test on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Mobile Testing

```bash
# Access from mobile on same network
http://YOUR_IP:8000
```

### Performance Optimization

1. Minimize asset sizes
2. Use texture atlases
3. Implement object pooling
4. Optimize draw calls
5. Use requestAnimationFrame

### Deployment Steps

```bash
# Build assets
npm run build

# Run migrations
php artisan migrate --force

# Clear caches
php artisan cache:clear

# Restart service
systemctl restart noteleks
```

## 🐛 Troubleshooting

### Game Not Starting

- Check browser console for errors
- Verify assets are loading
- Check CORS issues if loading from CDN

### Performance Issues

- Reduce particle effects
- Optimize sprite count
- Profile with browser DevTools
- Check for memory leaks

### Physics Not Working

- Ensure physics engine is enabled
- Check sprite has physics body
- Verify collision groups are set

### Mobile Touch Issues

- Test touch input handling
- Check viewport meta tag
- Test on actual devices
- Verify input scaling

## 📚 Resources

- [Phaser Documentation](https://phaser.io/docs)
- [Phaser Examples](https://phaser.io/examples)
- [Web APIs for Games](https://developer.mozilla.org/en-US/docs/Games)
- [WebGL Fundamentals](https://webglfundamentals.org/)

## 🎯 Common Game Elements

### Score System

```javascript
this.score = 0;
this.scoreText = this.add.text(10, 10, 'Score: 0');

addScore(points) {
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);
}
```

### Lives/Health

```javascript
this.lives = 3;
this.livesText = this.add.text(10, 40, `Lives: ${this.lives}`);

takeDamage() {
    this.lives--;
    if (this.lives <= 0) {
        this.gameOver();
    }
}
```

### Timer

```javascript
this.time.addEvent({
    delay: 1000,
    callback: updateTimer,
    loop: true
});
```

## 📝 Next Steps

- Implement game mechanics
- Add sound effects
- Create animations
- Optimize performance
- Deploy to production
