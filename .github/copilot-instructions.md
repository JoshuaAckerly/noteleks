# noteleks

## Purpose
Browser-based 2D action platformer ("Noteleks Heroes Beyond Light"). Built with Laravel for backend/asset-serving and Phaser.js for the game engine. Runs entirely in the browser — no Inertia, no React, no SSR.

## Tech Stack
- **Backend**: Laravel 13, PHP 8.3+
- **Game Engine**: Phaser.js 3.x, `@esotericsoftware/spine-phaser` 4.x (Spine skeletal animation)
- **Frontend**: Blade templates (no Inertia, no React)
- **Styling**: Tailwind CSS 4 (UI chrome only)
- **Build**: Vite 8, `scripts/convert_packer_to_phaser_atlas.js` (pre-build atlas converter)
- **Testing**: PHPUnit 12 (`php artisan test`), Vitest

## Architecture

### Backend (Laravel)
Minimal — serves the game view, legal pages, and Spine assets.

### Routes (`routes/web.php`)
- `GET /` — serves `resources/views/game.blade.php`
- `GET /privacy`, `/terms`, `/cookies` — legal Blade views
- `GET /spine/characters/{file}` — serves Spine assets (`.atlas`, `.json`, `.png`) from `public/spine/characters/` with correct MIME types and `Cache-Control: public, max-age=3600`

### Game Code (`resources/js/`)
Uses a modular ECS-inspired architecture. **All game code is plain JavaScript** (no TypeScript).

```
resources/js/
├── config/
│   └── GameConfig.js           # Central configuration (speeds, HP, physics, etc.)
├── core/
│   ├── GameObject.js           # Base entity class
│   ├── Component.js            # Base component class
│   └── Interfaces.js           # Type interfaces
├── components/                 # Reusable components attached to entities
│   ├── AIComponent.js
│   ├── MovementComponent.js
│   ├── HealthComponent.js
│   ├── InputComponent.js
│   ├── AttackComponent.js
│   └── PhysicsComponent.js
├── entities/
│   ├── Player.js               # Player entity (skeleton, no weapon)
│   └── Enemy.js                # Enemy entity (zombie, skeleton, ghost, boss)
├── managers/
│   ├── EnemyManager.js         # Enemy spawning and lifecycle
│   ├── InputManager.js         # WASD / Arrow / Space input
│   └── PlatformManager.js      # Platform and terrain management
├── systems/
│   └── SystemManager.js        # Coordinates all systems
├── factories/
│   └── GameObjectFactory.js    # Creates game objects
├── scenes/
│   ├── GameScene.js            # Main game scene
│   └── LoadingScene.js         # Asset loading scene
├── utils/
│   ├── AssetManager.js         # Asset loading utilities
│   └── GameUtils.js            # Math, state, input helpers
├── NoteleksGameModular.js      # Main game class
├── main-modular.js             # Entry point (imported by app.js)
└── app.js                      # Vite entry point
```

## Key Patterns
- **No Inertia / No React** — Blade-only frontend. Do not add Inertia or React.
- **Plain JS** — Game code is `.js`, not `.ts`. Do not convert to TypeScript.
- **Config-driven** — All tunable values (speeds, HP, cooldowns, physics) belong in `GameConfig.js`.
- **Component pattern** — Behaviors are components attached to `GameObject` instances. Add new behaviors as new component files.
- **Spine assets** — Characters use Spine skeletal animation. Assets in `public/spine/characters/` are served via the dedicated route with correct MIME types.
- **Atlas pre-build** — `npm run prebuild` runs `convert_packer_to_phaser_atlas.js` automatically before `vite build`.

## Build & Test
```bash
php artisan test           # PHPUnit
npm run test               # Vitest
npm run build              # Converts atlas then runs vite build
npm run dev                # Vite dev server
./vendor/bin/pint          # Code style
```

## Notable Files
- `resources/js/config/GameConfig.js` — all tunable game settings
- `resources/js/scenes/GameScene.js` — main game loop and scene
- `scripts/convert_packer_to_phaser_atlas.js` — atlas format converter (runs pre-build)
- `deploy-production.sh` — production deployment script
- `resources/js/MODULAR_ARCHITECTURE.md` — detailed architecture reference
