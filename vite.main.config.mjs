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
                ...Object.keys(require('./package.json').dependencies || {}).filter(dep => !dep.startsWith('@osmn-byhn/')),
            ],
            output: {
                banner: 'import { createRequire as __cjsRequire } from "module";\nconst require = __cjsRequire(import.meta.url);',
            },
        },
    },
});
