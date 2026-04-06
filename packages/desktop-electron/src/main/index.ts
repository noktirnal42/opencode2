// OpenCode2 Desktop - Main Process
import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron'
import windowState from 'electron-window-state'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Window state
let mainWindow: BrowserWindow | null = null

// Transparency settings
let windowOpacity = 1.0
let windowBlur = false

function createWindow() {
  // Load window state
  const state = windowState({
    defaultWidth: 1280,
    defaultHeight: 800
  })
  
  const isDark = nativeTheme.shouldUseDarkColors
  
  mainWindow = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 800,
    minHeight: 600,
    show: false,
    title: 'OpenCode2',
    backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
    opacity: windowOpacity,
    
    // macOS specific
    ...(process.platform === 'darwin' ? {
      titleBarStyle: 'hidden',
      trafficLightPosition: { x: 12, y: 14 }
    } : {}),
    
    // Windows specific
    ...(process.platform === 'win32' ? {
      frame: false,
      titleBarStyle: 'hidden'
    } : {}),
    
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true
    }
  })
  
  // Manage window state
  state.manage(mainWindow)
  
  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })
  
  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
  
  // Handle close
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC Handlers for transparency

// Set window opacity
ipcMain.handle('window:setOpacity', (_event, opacity: number) => {
  if (mainWindow && opacity >= 0.3 && opacity <= 1.0) {
    windowOpacity = opacity
    mainWindow.setOpacity(opacity)
    return true
  }
  return false
})

// Get window opacity
ipcMain.handle('window:getOpacity', () => {
  return windowOpacity
})

// Enable/disable blur (macOS)
ipcMain.handle('window:setBlur', (_event, enabled: boolean) => {
  if (mainWindow && process.platform === 'darwin') {
    windowBlur = enabled
    // macOS vibrancy effect
    mainWindow.setVibrancy(enabled ? 'hud' : null)
    return true
  }
  return false
})

// Set always on top
ipcMain.handle('window:setAlwaysOnTop', (_event, enabled: boolean) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(enabled)
    return true
  }
  return false
})

// Get window bounds
ipcMain.handle('window:getBounds', () => {
  return mainWindow?.getBounds() ?? null
})

// Minimize window
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize()
})

// Maximize/restore window
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.restore()
    return false
  } else {
    mainWindow?.maximize()
    return true
  }
})

// Close window
ipcMain.handle('window:close', () => {
  mainWindow?.close()
})

// Check if maximized
ipcMain.handle('window:isMaximized', () => {
  return mainWindow?.isMaximized() ?? false
})

// App lifecycle
app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

console.log('OpenCode2 Desktop initialized')