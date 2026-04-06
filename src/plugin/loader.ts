// Plugin Loader - Load and manage plugins
import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import type { 
  Plugin, 
  PluginManifest, 
  PluginTool, 
  PluginAgent, 
  PluginSkill,
  PluginStore,
  PluginLoaderOptions,
  PluginHooks
} from './types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Default plugin directory
function getDefaultPluginDir(): string {
  const home = process.env.HOME || process.env.USERPROFILE || '.'
  return path.join(home, '.opencode', 'plugins')
}

// Create empty plugin store
export function createPluginStore(): PluginStore {
  return {
    plugins: new Map(),
    tools: new Map(),
    agents: new Map(),
    skills: new Map()
  }
}

// Load plugin manifest from directory
async function loadManifest(pluginDir: string): Promise<PluginManifest | null> {
  const manifestPath = path.join(pluginDir, 'plugin.json')
  
  try {
    const content = await fs.readFile(manifestPath, 'utf-8')
    return JSON.parse(content) as PluginManifest
  } catch {
    return null
  }
}

// Load a single plugin
export async function loadPlugin(
  pluginPath: string
): Promise<Plugin | null> {
  const manifest = await loadManifest(pluginPath)
  if (!manifest) return null
  
  try {
    // Dynamic import of plugin module
    const pluginModule = await import(path.join(pluginPath, manifest.main))
    const pluginFactory = pluginModule.default || pluginModule
    
    let plugin: Plugin
    
    if (typeof pluginFactory === 'function') {
      // Plugin is a factory function
      plugin = await pluginFactory()
    } else if (typeof pluginFactory === 'object') {
      // Plugin is already an object
      plugin = pluginFactory as Plugin
    } else {
      console.error(`Invalid plugin format in ${pluginPath}`)
      return null
    }
    
    // Validate plugin structure
    if (!plugin.tools && !plugin.agents && !plugin.skills) {
      console.error(`Plugin ${manifest.name} must export at least one of: tools, agents, skills`)
      return null
    }
    
    plugin.manifest = manifest
    return plugin
    
  } catch (error) {
    console.error(`Failed to load plugin from ${pluginPath}:`, error)
    return null
  }
}

// Load all plugins from directory
export async function loadPlugins(
  store: PluginStore,
  options: PluginLoaderOptions = { pluginDir: getDefaultPluginDir() }
): Promise<string[]> {
  const pluginDir = options.pluginDir || getDefaultPluginDir()
  const loaded: string[] = []
  
  try {
    await fs.mkdir(pluginDir, { recursive: true })
    const entries = await fs.readdir(pluginDir, { withFileTypes: true })
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginPath = path.join(pluginDir, entry.name)
        const plugin = await loadPlugin(pluginPath)
        
        if (plugin) {
          // Register plugin
          store.plugins.set(plugin.manifest.name, plugin)
          
          // Register tools
          for (const tool of plugin.tools || []) {
            store.tools.set(tool.name, tool)
          }
          
          // Register agents
          for (const agent of plugin.agents || []) {
            store.agents.set(agent.name, agent)
          }
          
          // Register skills
          for (const skill of plugin.skills || []) {
            store.skills.set(skill.name, skill)
          }
          
          // Call onLoad hook
          if (plugin.onLoad) {
            await plugin.onLoad()
          }
          
          loaded.push(plugin.manifest.name)
        }
      }
    }
  } catch (error) {
    console.error('Failed to load plugins:', error)
  }
  
  return loaded
}

// Unload a plugin
export async function unloadPlugin(
  store: PluginStore,
  pluginName: string
): Promise<boolean> {
  const plugin = store.plugins.get(pluginName)
  if (!plugin) return false
  
  // Call onUnload hook
  if (plugin.onUnload) {
    await plugin.onUnload()
  }
  
  // Unregister tools
  for (const tool of plugin.tools || []) {
    store.tools.delete(tool.name)
  }
  
  // Unregister agents
  for (const agent of plugin.agents || []) {
    store.agents.delete(agent.name)
  }
  
  // Unregister skills
  for (const skill of plugin.skills || []) {
    store.skills.delete(skill.name)
  }
  
  // Remove plugin
  store.plugins.delete(pluginName)
  
  return true
}

// Enable a plugin
export async function enablePlugin(
  store: PluginStore,
  pluginName: string
): Promise<boolean> {
  const plugin = store.plugins.get(pluginName)
  if (!plugin) return false
  
  plugin.manifest.enabled = true
  
  // Re-register if not already registered
  if (!store.tools.has(plugin.tools?.[0]?.name || '')) {
    for (const tool of plugin.tools || []) {
      store.tools.set(tool.name, tool)
    }
  }
  
  return true
}

// Disable a plugin
export async function disablePlugin(
  store: PluginStore,
  pluginName: string
): Promise<boolean> {
  const plugin = store.plugins.get(pluginName)
  if (!plugin) return false
  
  plugin.manifest.enabled = false
  
  // Unregister tools (but keep agent references)
  for (const tool of plugin.tools || []) {
    store.tools.delete(tool.name)
  }
  
  return true
}

// Get plugin by name
export function getPlugin(store: PluginStore, name: string): Plugin | undefined {
  return store.plugins.get(name)
}

// Get plugin tool
export function getPluginTool(store: PluginStore, name: string): PluginTool | undefined {
  return store.tools.get(name)
}

// Get plugin agent
export function getPluginAgent(store: PluginStore, name: string): PluginAgent | undefined {
  return store.agents.get(name)
}

// Get plugin skill
export function getPluginSkill(store: PluginStore, name: string): PluginSkill | undefined {
  return store.skills.get(name)
}

// List all loaded plugins
export function listPlugins(store: PluginStore): PluginManifest[] {
  return Array.from(store.plugins.values()).map(p => p.manifest)
}

// Create plugin hooks middleware
export function createPluginHooks(
  store: PluginStore
): PluginHooks {
  return {
    beforeToolCall: (toolName: string, input: unknown) => {
      // Could trigger beforeToolCall on all plugins
    },
    afterToolCall: (toolName: string, input: unknown, result: unknown) => {
      // Could trigger afterToolCall on all plugins
    },
    beforeMessage: (message: unknown) => {
      // Could trigger beforeMessage on all plugins
    },
    afterMessage: (message: unknown) => {
      // Could trigger afterMessage on all plugins
    },
    onError: (error: Error) => {
      // Could trigger onError on all plugins
    }
  }
}
