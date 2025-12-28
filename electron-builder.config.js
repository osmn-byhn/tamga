/** @type {import('electron-builder').Configuration} */
export default {
  appId: 'com.sphinxpass.app',
  productName: 'SphinxPass',
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
    icon: 'public/sphinxpass.png',
  },
  linux: {
    target: ['AppImage', 'deb'],
    icon: 'public/sphinxpass.png',
  },
  mac: {
    target: ['dmg'],
    icon: 'public/sphinxpass.png',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
  },
}


