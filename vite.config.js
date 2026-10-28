import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { shaderFilesPlugin } from './src/lib/shaderFiles.js';

export default defineConfig({
    plugins: [react(), shaderFilesPlugin()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.js'],
        restoreMocks: true,
    },
});
