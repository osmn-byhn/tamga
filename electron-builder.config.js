/** @type {import('electron-builder').Configuration} */
export default {
  appId: 'com.tamga.app',
  productName: 'Tamga',
  directories: {
    output: 'release',
    buildResources: 'build',
  },
  files: [
    'dist/**/*',
    'electron/**/*',
    '.vite/**/*',
    'package.json',
  ],
  linux: {
    target: ['rpm', 'AppImage'],
    category: 'Security',
    icon: 'public/tamga.png',
    maintainer: 'Tamga Team <contact@tamga.app>',
    vendor: 'Tamga Team',
    synopsis: 'Secure local-first vault.',
  },
  win: {
    target: ['nsis'],
    icon: 'public/tamga.ico',
  },
  mac: {
    target: ['dmg', 'zip'],
    icon: 'public/tamga.ico',
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Tamga',
    artifactName: '${productName}-Setup-${version}.${ext}',
  },
}