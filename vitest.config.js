import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['resources/js/__tests__/**/*.test.{js,ts}'],
        setupFiles: ['resources/js/test/setup.js'],
        globals: true,
    },
    resolve: {
        alias: {
            phaser: path.resolve(__dirname, 'resources/js/phaser-shim.js'),
        },
    },
});
