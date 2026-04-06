// Preload script - Expose safe APIs to renderer
import { contextBridge, ipcRenderer } from 'electron'

// Window API
const windowApi = {
  setOpacity: (opacity: number) => ipcRenderer.invoke('window:setOpacity', opacity),
  getOpacity: () => ipcRenderer.invoke('window:getOpacity'),
  setBlur: (enabled: boolean) => ipcRenderer.invoke('window:setBlur', enabled),
  setAlwaysOnTop: (enabled: boolean) => ipcRenderer.invoke('window:setAlwaysOnTop', enabled),
  getBounds: () => ipcRenderer.invoke('window:getBounds'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  
  // Listeners
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
    ipcRenderer.on('window:maximizeChange', (_event, isMaximized) => callback(isMaximized))
  }
}

// Platform info
const platformApi = {
  platform: process.platform,
  arch: process.arch,
  version: process.getSystemVersion()
}

// Expose to renderer
contextBridge.exposeInMainWorld('api', {
  window: windowApi,
  platform: platformApi,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
})

// Type declaration for renderer
declare global {
  interface Window {
    api: {
      window: typeof windowApi
      platform: typeof platformApi
      versions: {
        node: string
        chrome: string
        electron: string
      }
    }
  }
}