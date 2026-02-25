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
    'dist-electron/**/*',
    'package.json',
  ],
  win: {
    target: ['nsis'],
    icon: 'public/tamga.png',
  },
  linux: {
    target: ['AppImage', 'deb'],
    icon: 'public/tamga.png',
  },
  mac: {
    target: ['dmg'],
    icon: 'public/tamga.png',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
}


