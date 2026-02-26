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
    target: ['nsis', 'portable'],
    icon: 'public/tamga.ico',
  },
  mac: {
    target: ['dmg', 'zip'],
    icon: 'public/tamga.ico',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
}