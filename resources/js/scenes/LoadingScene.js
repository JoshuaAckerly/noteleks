/* global Phaser */
import GameConfig from '../config/GameConfig.js';
import { AssetManager } from '../utils/AssetManagerSimple.js';

// Per-animation timing overrides (defaults: 12fps, repeat -1)
const ANIM_CONFIG = {
    'skeleton-idle': { frameRate: 8, repeat: -1 },
    'skeleton-run': { frameRate: 12, repeat: -1 },
    'skeleton-walk': { frameRate: 12, repeat: -1 },
    'skeleton-jump': { frameRate: 1, repeat: 0 },
    'skeleton-attack1': { frameRate: 10, repeat: 0 },
    'skeleton-attack2': { frameRate: 10, repeat: 0 },
    'skeleton-jumpattack': { frameRate: 15, repeat: 0 },
};

class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
    }

    preload() {
        try {
            this.cameras.main.setBackgroundColor(GameConfig.screen.backgroundColor);
        } catch {
            /* ignore */
        }

        // Progress UI
        try {
            const w = (GameConfig && GameConfig.screen && GameConfig.screen.width) || this.cameras.main.width;
            const h = (GameConfig && GameConfig.screen && GameConfig.screen.height) || this.cameras.main.height;
            this._stageText = this.add
                .text(w / 2, h / 2 - 16, 'Stage 1/2 — Loading manifest…', { font: '12px Arial', fill: '#aaaaaa' })
                .setOrigin(0.5);
            this._progressText = this.add.text(w / 2, h / 2 + 8, '0%', { font: '16px Arial', fill: '#ffffff' }).setOrigin(0.5);
        } catch {
            /* ignore */
        }

        this.load.on('progress', (p) => {
            if (this._progressText) this._progressText.setText(Math.round(p * 100) + '%');
        });

        // Stage 1: load the sprite manifest
        const manifestUrl = GameConfig.assets?.sprites?.manifest;
        if (manifestUrl) {
            this.load.json('sprite-manifest', manifestUrl);
        }

        if (
            GameConfig.useSpine &&
            GameConfig.assets?.spine &&
            typeof this.load.spineBinary === 'function' &&
            typeof this.load.spineAtlas === 'function'
        ) {
            this.load.spineBinary(GameConfig.assets.spine.dataKey, GameConfig.assets.spine.skel);
            this.load.spineAtlas(GameConfig.assets.spine.atlasKey, GameConfig.assets.spine.atlas);
        }
    }

    create() {
        // Stage 2: read manifest, queue all frame images + static assets, start second load pass
        try {
            const manifestUrl = GameConfig.assets?.sprites?.manifest;
            const manifest = this.cache.json.get('sprite-manifest');
            if (!manifestUrl || !manifest) {
                this.scene.start('GameScene');
                return;
            }

            if (this._stageText) this._stageText.setText('Stage 2/2 — Loading sprites…');
            if (this._progressText) this._progressText.setText('0%');

            AssetManager.queueAssetsFromManifest(this, manifest, ANIM_CONFIG);

            // Static assets not covered by the manifest
            this.load.image('spear', '/games/noteleks/sprites/Spear.png');

            this.load.on('progress', (p) => {
                if (this._progressText) this._progressText.setText(Math.round(p * 100) + '%');
            });

            this.load.once('complete', () => {
                this.scene.start('GameScene');
            });

            this.load.start();
        } catch (e) {
            console.warn('[LoadingScene] Asset loading failed', e.message);
            this.scene.start('GameScene');
        }
    }
}

export default LoadingScene;
