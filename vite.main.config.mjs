import { defineConfig } from 'vite';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export default defineConfig({
    build: {
        outDir: '.vite/build',
        lib: {
            entry: 'electron/main.js',
            formats: ['cjs'],
            fileName: () => 'main.cjs',
        },
        rollupOptions: {
            external: ['electron', 'node:url', 'node:path', 'node:fs', ...Object.keys(require('./package.json').dependencies || {})],
        },
    },
});
