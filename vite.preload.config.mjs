import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'electron/preload.cjs',
            formats: ['cjs'],
            fileName: () => 'preload.cjs',
        },
    },
});
