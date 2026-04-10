# Noteleks

> A browser-based game built with Laravel and Phaser.js, offering interactive gameplay directly in the web browser.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Laravel](https://img.shields.io/badge/Laravel-12.x-FF2D20?logo=laravel)](https://laravel.com)
[![Phaser](https://img.shields.io/badge/Phaser-3.x-0066CC?logo=phaser)](https://phaser.io)

## 🎮 Overview

Noteleks is a fully-featured browser-based game that runs directly in modern web browsers. Built with Laravel for backend logic and Phaser.js for the game engine, it provides an engaging gaming experience across desktop and mobile devices.

**Features**:

- 🎮 **Interactive Gameplay**: Real-time game mechanics powered by Phaser.js
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 🏆 **Scoring & Progress**: Track player progress and high scores
- 🎨 **Rich Graphics**: Smooth animations and visual effects
- 💾 **Game State Persistence**: Save and load game progress
- ⚡ **Fast Performance**: Optimized for smooth 60 FPS gameplay

## 🛠 Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Backend** | Laravel 12 | Game logic and state management |
| **Game Engine** | Phaser.js 3.x | Browser game framework |
| **Frontend** | Blade Templates | HTML rendering |
| **Styling** | Tailwind CSS 4 | Responsive UI |
| **Database** | MySQL 8.0+ | Game state and user data |
| **Build Tool** | Vite 7 | Asset bundling |

## 🚀 Quick Start

### Prerequisites

- PHP 8.2 or higher
- Node.js 18+ and npm
- Composer
- MySQL 8.0 or higher
- Modern web browser with WebGL support

### Installation

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

# Database setup
php artisan migrate

# Start development servers
# Terminal 1: Laravel
php artisan serve --port=8000

# Terminal 2: Vite
npm run dev
```

### Development URLs

- **Game**: http://localhost:8000
- **Vite Dev Server**: http://localhost:8008

## 📚 Documentation

- [Development Guide](DEVELOPMENT.md) - Game development and customization
- [Architecture](docs/ARCHITECTURE.md) - System design and patterns (if available)
- [Contributing](CONTRIBUTING.md) - How to contribute

## 🎮 Game Architecture

The game is structured with:

- **Scenes**: Menu, Gameplay, GameOver, Pause
- **Sprites**: Player, Enemies, Collectibles, Obstacles
- **Physics Engine**: Phaser's built-in physics for collisions
- **Input Handling**: Keyboard, mouse, and touch support
- **Score System**: Real-time scoring and high-score tracking

## 🔧 Building & Deployment

### Development Build

```bash
npm run dev
```

### Production Build

```bash
npm run build
php artisan migrate --force
php artisan cache:clear
```

## 📱 Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome Mobile)

## 🧪 Testing

```bash
# Run PHP tests
./vendor/bin/phpunit

# Run JavaScript tests
npm test
```

## 🚀 Deployment

```bash
# Build assets
npm run build

# Run migrations
php artisan migrate --force

# Clear caches
php artisan cache:clear

# Restart application service
systemctl restart noteleks
```

## 📖 Features

### Gameplay
- Interactive game mechanics
- Real-time physics simulation
- Collision detection
- Responsive controls

### User Management
- Player registration and login
- Profile tracking
- Game progress saving
- High score leaderboard

### Analytics
- Game session tracking
- Player engagement metrics
- Performance monitoring

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📝 License

Licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

## 🎯 Performance Tips

1. **Asset Optimization**: Use compressed sprites and images
2. **Web Workers**: Offload heavy computation
3. **Memory Management**: Implement object pooling
4. **Rendering**: Use texture atlases for efficient rendering
5. **Testing**: Test on actual devices

## 🔗 Resources

- [Phaser Documentation](https://phaser.io/docs)
- [Phaser Examples](https://phaser.io/examples)
- [Laravel Documentation](https://laravel.com/docs)
- [Web Game Development](https://developer.mozilla.org/en-US/docs/Games)

Happy gaming! 🎮

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
