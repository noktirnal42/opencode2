// Plugin System - Export all plugin modules
export * from './types'
export * from './loader'

// Convenience re-exports
export const plugins = {
  createStore: () => import('./loader').then(m => m.createPluginStore()),
  load: (store: import('./types').PluginStore, options?: import('./types').PluginLoaderOptions) => 
    import('./loader').then(m => m.loadPlugins(store, options)),
  unload: (store: import('./types').PluginStore, name: string) => 
    import('./loader').then(m => m.unloadPlugin(store, name)),
  enable: (store: import('./types').PluginStore, name: string) => 
    import('./loader').then(m => m.enablePlugin(store, name)),
  disable: (store: import('./types').PluginStore, name: string) => 
    import('./loader').then(m => m.disablePlugin(store, name)),
  getTool: (store: import('./types').PluginStore, name: string) => 
    import('./loader').then(m => m.getPluginTool(store, name)),
  getAgent: (store: import('./types').PluginStore, name: string) => 
    import('./loader').then(m => m.getPluginAgent(store, name)),
  getSkill: (store: import('./types').PluginStore, name: string) => 
    import('./loader').then(m => m.getPluginSkill(store, name)),
  list: (store: import('./types').PluginStore) => 
    import('./loader').then(m => m.listPlugins(store)),
}
