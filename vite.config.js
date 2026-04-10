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
            origin: ['http://noteleks.graveyardjokes.local'],
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
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            // Phaser is loaded from CDN in the blade template; keep it external
            external: ['phaser'],
            output: {
                globals: { phaser: 'Phaser' },
            },
        },
    },
});

