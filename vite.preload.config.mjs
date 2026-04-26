import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        emptyOutDir: false,
        lib: {
            entry: 'electron/preload.cjs',
            formats: ['cjs'],
            fileName: () => 'preload.cjs',
        },
    },
});
