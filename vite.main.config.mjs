import { defineConfig } from 'vite';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// All Node.js built-ins (both with and without the node: prefix)
import builtinModulesModule from 'module';
const nodeBuiltins = builtinModulesModule.builtinModules.flatMap((m) => [m, `node:${m}`]);

export default defineConfig({
    build: {
        outDir: '.vite/build',
        emptyOutDir: false,
        lib: {
            entry: 'electron/main.js',
            formats: ['es'],
            fileName: () => 'main.js',
        },
        rollupOptions: {
            external: [
                'electron',
                ...nodeBuiltins,
                ...Object.keys(require('./package.json').dependencies || {}),
            ],
        },
    },
});
