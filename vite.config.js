import { defineConfig } from 'vite';
import path from 'path';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    server: {
        port: 8008,
        host: '0.0.0.0',
        origin: 'http://noteleks.graveyardjokes.local:8008',
        hmr: {
            host: 'noteleks.graveyardjokes.local',
        },
        cors: {
            origin: [
                'http://noteleks.graveyardjokes.local',
                'http://noteleks.graveyardjokes.local:8009',
                'http://localhost:8009',
            ],
            credentials: true,
        },
        allowedHosts: ['noteleks.graveyardjokes.local'],
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/main-modular.js'],
            refresh: true,
        }),
    ],
    resolve: {
        alias: {
            // Phaser is loaded from CDN as a classic script (window.Phaser).
            // spine-phaser does `import * as Phaser from 'phaser'` which fails
            // in browsers without an import-map. This shim re-exports all
            // Phaser namespaces from the already-loaded window.Phaser global
            // so the dynamic spine chunk resolves correctly at runtime.
            phaser: path.resolve(__dirname, 'resources/js/phaser-shim.js'),
        },
    },
    build: {
        chunkSizeWarningLimit: 1000,
    },
});

