// Configuration Management
import * as fs from 'fs/promises'
import * as path from 'path'
import * as os from 'os'
import type { Config, ProviderConfig } from '@/types'

const CONFIG_DIR = '.opencode'
const CONFIG_FILE = 'config.yaml'

const DEFAULT_CONFIG: Config = {
  version: '2.0',
  providers: {
    anthropic: {
      type: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY,
      models: [
        { name: 'claude-sonnet-4-20250514', contextLength: 200000 },
        { name: 'claude-haiku-3-5', contextLength: 200000 }
      ]
    },
    openai: {
      type: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      models: [
        { name: 'gpt-4o', contextLength: 128000 },
        { name: 'gpt-4o-mini', contextLength: 128000 }
      ]
    }
  },
  agents: {
    build: {
      model: 'claude-sonnet-4-20250514'
    },
    plan: {
      model: 'claude-haiku-3-5'
    }
  },
  memory: {
    autoMemory: true,
    autoDream: {
      enabled: true,
      minHours: 24,
      minSessions: 5
    }
  },
  compaction: {
    enabled: true,
    maxTokens: 200000,
    warningThreshold: 180000,
    autoCompact: true
  },
  mcp: {
    servers: [],
    autoApprove: false
  },
  permissions: {
    defaultMode: 'ask'
  },
  localModels: {
    ollama: {
      enabled: true,
      baseUrl: 'http://localhost:11434'
    },
    lmstudio: {
      enabled: true,
      baseUrl: 'http://localhost:1234/v1'
    }
  },
  desktop: {
    transparency: {
      enabled: true,
      defaultOpacity: 1.0,
      minOpacity: 0.3,
      maxOpacity: 1.0
    }
  }
}

export class ConfigManager {
  private configPath: string
  private config: Config
  
  constructor(cwd: string = process.cwd()) {
    this.configPath = path.join(cwd, CONFIG_DIR, CONFIG_FILE)
    this.config = { ...DEFAULT_CONFIG }
  }
  
  async load(): Promise<Config> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8')
      // Simple YAML-like parsing for now
      // In production, use a proper YAML parser
      const parsed = JSON.parse(content)
      this.config = { ...DEFAULT_CONFIG, ...parsed }
    } catch {
      // Use defaults if no config exists
      this.config = { ...DEFAULT_CONFIG }
    }
    return this.config
  }
  
  async save(): Promise<void> {
    const dir = path.dirname(this.configPath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8')
  }
  
  get(): Config {
    return this.config
  }
  
  set(config: Partial<Config>): void {
    this.config = { ...this.config, ...config }
  }
  
  getProvider(name: string): ProviderConfig | undefined {
    return this.config.providers[name]
  }
  
  setProvider(name: string, config: ProviderConfig): void {
    this.config.providers[name] = config
  }
  
  getAgentConfig(name: string) {
    return this.config.agents[name]
  }
  
  // Global config (user-wide)
  static globalConfigPath(): string {
    return path.join(os.homedir(), CONFIG_DIR, CONFIG_FILE)
  }
  
  async loadGlobal(): Promise<Config> {
    try {
      const content = await fs.readFile(ConfigManager.globalConfigPath(), 'utf-8')
      return JSON.parse(content)
    } catch {
      return DEFAULT_CONFIG
    }
  }
}

export const configManager = new ConfigManager()