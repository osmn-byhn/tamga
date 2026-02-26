export default {
    packagerConfig: {
        name: 'tamga',
        executableName: 'tamga',
        icon: './public/tamga',
        asar: true,
    },
    rebuildConfig: {},
    makers: [
        {
            name: '@electron-forge/maker-zip',
            platforms: ['win32', 'darwin'],
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
        },
        {
            name: '@electron-forge/maker-deb',
            config: {
                options: {
                    name: 'tamga',
                    productName: 'Tamga',
                    genericName: 'Tamga',
                    description: 'Secure local-first security vault.',
                    categories: ['Utility'],
                    license: 'MIT',
                    icon: './public/tamga.png',
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