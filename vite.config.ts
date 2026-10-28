import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { shaderFilesPlugin } from './src/lib/shaderFilesPlugin.ts';

export default defineConfig({
    plugins: [react(), shaderFilesPlugin()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        restoreMocks: true,
    },
});
