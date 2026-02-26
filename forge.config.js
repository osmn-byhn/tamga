export default {
    packagerConfig: {
        name: 'tamga',
        executableName: 'tamga',
        icon: './public/tamga',
        asar: true,
        ignore: [
            /^\/src/,
            /^\/public/,
            /^\/electron/,
            /^\/\.git/,
            /^\/\.vite\/renderer/,
            /^\/index\.html$/,
            /^\/\.gitignore$/,
            /^\/vite\.config\.js$/,
            /^\/vite\.main\.config\.mjs$/,
            /^\/vite\.preload\.config\.mjs$/,
            /^\/tailwind\.config\.js$/,
            /^\/postcss\.config\.js$/,
            /^\/eslint\.config\.js$/,
            /\.log$/,
        ],
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-zip',
            platforms: ['linux', 'win32', 'darwin'],
        },
        {
            name: '@electron-forge/maker-rpm',
            config: {
                options: {
                    name: 'tamga',
                    productName: 'Tamga',
                    genericName: 'Tamga',
                    description: 'Secure local-first security vault.',
                    categories: ['Utility'],
                    license: 'MIT',
                    icon: './public/tamga.png',
                    vendor: 'Tamga Team',
                    homepage: 'https://github.com/osmn-byhn/tamga',
                    maintainer: 'Tamga Team <contact@tamga.app>'
                }
            },
        }
    ],
    plugins: [
        {
            name: '@electron-forge/plugin-vite',
            config: {
                build: [
                    {
                        entry: 'electron/main.js',
                        config: 'vite.main.config.mjs',
                    },
                    {
                        entry: 'electron/preload.cjs',
                        config: 'vite.preload.config.mjs',
                    },
                ],
                renderer: [
                    {
                        name: 'main_window',
                        config: 'vite.config.js',
                    },
                ],
            },
        },
    ],
};