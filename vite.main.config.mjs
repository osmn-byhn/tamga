import { defineConfig } from 'vite';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default defineConfig({
    build: {
        lib: {
            entry: 'electron/main.js',
            formats: ['cjs'],
            fileName: () => 'main.js',
        },
        rollupOptions: {
            external: ['electron', ...Object.keys(require('./package.json').dependencies || {})],
        },
    },
});
