export default {
  appId: "com.tamga.app",
  productName: "Tamga",

  directories: {
    output: "release/${version}",
    buildResources: "public"
  },

  files: [
    "dist/**/*",
    "electron/**/*",
    ".vite/**/*",
    "package.json"
  ],

  linux: {
    target: ["AppImage", "deb", "rpm", "snap", "flatpak", "pacman", "tar.gz"],
    category: "Security",
    executableName: "tamga",
    icon: "public/tamga.png",
    maintainer: "Osman Beyhan <developer@osmanbeyhan.com>",
    vendor: "Osman Beyhan",
    synopsis: "Secure local-first vault."
  },

  rpm: {
    compression: "xz"
  },

  win: {
    target: ["nsis", "msi", "portable", "zip"],
    icon: "public/tamga.ico"
  },

  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false
  },

  mac: {
    target: ["dmg", "pkg", "zip"],
    icon: "public/tamga.icns",
    category: "public.app-category.security"
  }
}