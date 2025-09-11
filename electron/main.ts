import { app, BrowserWindow } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { setup7ZipHandlers } from '../src/sevenZip'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

// Handle squirrel startup for Windows installer
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const squirrelStartup = require('electron-squirrel-startup');
if (squirrelStartup) {
  app.quit();
}

function createWindow() {
  app.setAppUserModelId('com.qzipelectron.app');
  // Resolve preload, always basing on current preload.mjs to avoid stale CJS copies
  const preloadDir = __dirname
  const preloadMjs = path.join(preloadDir, 'preload.mjs')
  let preloadPath = preloadMjs
  try {
    if (fs.existsSync(preloadMjs)) {
      const content = fs.readFileSync(preloadMjs, 'utf-8')
      if (/\brequire\(/.test(content) || /module\.exports/.test(content)) {
        const cjsPath = path.join(preloadDir, 'preload.cjs')
        // Overwrite every run to ensure latest API (e.g., createTempCopies)
        fs.writeFileSync(cjsPath, content, 'utf-8')
        preloadPath = cjsPath
      }
    } else {
      // Fallback to preload.js if preload.mjs is missing
      const jsPath = path.join(preloadDir, 'preload.js')
      if (fs.existsSync(jsPath)) preloadPath = jsPath
    }
  } catch { }

  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      // Disable sandbox so Electron exposes File.path in the renderer for drag & drop
      sandbox: false,
    },
  })

  // Window-level drag&drop diagnostics (main process)
  try {
    win.webContents.on('will-navigate', (e, url) => {
      if (url.startsWith('file://') || url.startsWith('http://') || url.startsWith('https://')) {
        console.log('[MAIN] will-navigate prevented:', url)
        e.preventDefault()
      }
    })
    win.webContents.on('did-start-navigation', (_e, url, isInPlace) => {
      console.log('[MAIN] did-start-navigation url:', url, 'inPlace:', isInPlace)
    })
  } catch { }

  // Set up 7-Zip IPC handlers
  setup7ZipHandlers();

  // Open DevTools in development mode (Phase 2 feature)
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools({ mode: 'detach' })
  }

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
