# Tamga

**Tamga** is a comprehensive digital vault and security management platform designed for developers and security-conscious users, featuring a **local-first** and **zero-knowledge** architecture.

### 🏺 Why "Tamga"?
The name **Tamga** comes from ancient Turkic culture and means a **seal or tribal mark** used to represent identity, ownership, and authority.

This name fits the application perfectly because it allows users to **seal and protect their digital identity and passwords locally**, under their own control.

In short:
> **Tamga = A digital seal.**
> Your data is yours. Your control. 🔐
## 🎯 Project Goal
The primary goal of Tamga is to protect the user's most sensitive digital assets (passwords, 2FA codes, environment variables) without having to trust the cloud, keeping everything on their own device with military-grade encryption.

## 🛠️ Key Features
1.  **Password Management & Generator**: Create strong, complex passwords and store them in an encrypted history categorized by platform and username.
2.  **Desktop OTP (TOTP) Management**: An alternative to mobile apps like Google Authenticator or Authy, generating 2FA codes directly on your desktop.
    *   **Google Authenticator Migration**: Directly decode and import all your accounts from Google Authenticator export QR codes (`otpauth-migration://`) in one go.
3.  **Secure .env Management**: Store sensitive `.env` files used in developer projects in an encrypted vault instead of leaving them as plain text on your machine.
4.  **Backup Codes & Passkey Vault**: Securely store critical backup codes and passkey secrets provided by various services.
5.  **Advanced Encryption**: All data is encrypted locally using **AES-GCM 256-bit** algorithms with keys derived from the user-defined "Master Password" via PBKDF2.

## 💡 Problems Solved

### 1. Cloud Security Concerns
Many password managers store data in the cloud. A breach at the cloud provider could lead to your data being leaked. **Tamga** never sends your data to the internet; everything remains encrypted in your local database.

### 2. Fragmented Security Tools
Passwords, 2FA codes, and `.env` files are often scattered across different devices and locations. **Tamga** consolidates all these developer and security tools under one roof.

### 3. Developer ".env" Security
Developers often keep `.env` files containing sensitive API keys as plain text on their computers. These can be easily stolen by malware. **Tamga** eliminates this risk by keeping these files in an encrypted vault.

### 4. Difficulty Migrating from Authenticator Apps
Tamga features a built-in decoder for Google's proprietary export format, allowing you to move dozens of accounts from your phone to your desktop in seconds.

## 💻 Technical Architecture
- **Frontend**: React, Vite, Tailwind CSS, Lucide icons.
- **Runtime**: Electron.
- **Security**: Key derivation using PBKDF2 and encryption via AES-GCM using the Web Crypto API (SubtleCrypto).
- **Storage**: Data is stored as encrypted JSON blocks in local storage (localStorage).

---

## 🚀 Running for Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/osmn-byhn/tamga.git
cd tamga

# 2. Install dependencies
npm install

# 3. Start the app in development mode
npm run dev
```

This starts the Vite dev server and launches Electron simultaneously. Hot-reloading is enabled — changes to the React frontend update instantly in the Electron window.

### Build for Production

```bash
npm run make
```

Output distributables (`.zip`, `.rpm`, etc.) will be placed in the [tamga-1.0.0-1](https://github.com/osmn-byhn/tamga/releases) directory.

---

*Tamga is a modern **digital seal** that gives you full ownership of your digital assets.*