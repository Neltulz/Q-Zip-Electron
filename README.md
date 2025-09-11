# Q-Zip Electron

A desktop application built with React, TypeScript, Vite, and Electron. This project provides a modern development setup for creating cross-platform desktop applications.

## 🚀 Features

- ⚡ **Fast Development**: Vite for lightning-fast HMR and builds
- 🖥️ **Cross-Platform**: Electron for Windows, macOS, and Linux
- ⚛️ **Modern React**: Latest React with TypeScript support
- 🎨 **UI Framework**: Ready for your favorite UI library
- 📦 **Build System**: Automated packaging with electron-builder
- 🧹 **Code Quality**: ESLint configuration for clean code

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **pnpm** (package manager)
- **Git**

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Neltulz/Q-Zip-Electron.git
   cd Q-Zip-Electron
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

## 🚀 Development

### Start Development Server
```bash
pnpm dev
```

This will:
- Start Vite's development server
- Launch the Electron application
- Enable hot module replacement (HMR)

### Preview Production Build
```bash
pnpm preview
```

## 🏗️ Building

### Regular Packaged Build
Creates installers and packaged executables:
```bash
pnpm run build
```

**Output:** `release/[version]/`
- Windows: `YourAppName-Windows-[version]-Setup.exe` (installer)
- macOS: `YourAppName-Mac-[version].dmg` (if configured)
- Linux: `YourAppName-Linux-[version].AppImage` (if configured)

### Unpackaged Build (Directory)
Creates a portable directory with the executable:
```bash
pnpm run build:unpackaged
```

**Output:** `release/[version]/win-unpacked/`
- Contains: `YourAppName.exe` + all necessary files
- Portable - no installation required
- Perfect for testing or distribution

## 📁 Project Structure

```
Q-Zip-Electron/
├── electron/                 # Electron main process files
│   ├── main.ts              # Main Electron process
│   └── preload.ts           # Preload script
├── src/                     # React application source
│   ├── App.tsx              # Main React component
│   ├── main.tsx             # React entry point
│   └── assets/              # Static assets
├── dist/                    # Built React app (generated)
├── dist-electron/           # Built Electron files (generated)
├── release/                 # Packaged builds (generated)
├── public/                  # Public assets
├── package.json             # Project configuration
├── vite.config.ts           # Vite configuration
├── electron-builder.json5   # Electron builder configuration
└── tsconfig.json            # TypeScript configuration
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Create packaged build |
| `pnpm run build:unpackaged` | Create unpackaged directory build |
| `pnpm preview` | Preview production build |
| `pnpm lint` | Run ESLint |

## 🖥️ Distribution

### Windows
- **Installer:** `release/[version]/YourAppName-Windows-[version]-Setup.exe`
- **Portable:** `release/[version]/win-unpacked/` (zip this folder)

### macOS (when configured)
- **DMG:** `release/[version]/YourAppName-Mac-[version].dmg`

### Linux (when configured)
- **AppImage:** `release/[version]/YourAppName-Linux-[version].AppImage`

## 🛠️ Technologies Used

- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Desktop:** Electron
- **Packaging:** electron-builder
- **Code Quality:** ESLint + TypeScript ESLint
- **Package Manager:** pnpm

## 📝 Configuration Files

- `electron-builder.json5` - Electron packaging configuration
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Project dependencies and scripts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests and linting
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## 📄 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.