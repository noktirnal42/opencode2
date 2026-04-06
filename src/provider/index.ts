// Provider System - LLM Provider Adapters
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createAzure } from '@ai-sdk/azure'
import type { LanguageModel, Provider } from 'ai'
import type { ProviderConfig } from '@/types'

// Ollama provider
export interface OllamaConfig {
  baseUrl?: string
  timeout?: number
}

export interface OllamaModel {
  name: string
  size?: number
  modified_at?: string
}

export class OllamaProvider {
  private baseUrl: string
  
  constructor(config: OllamaConfig = {}) {
    this.baseUrl = config.baseUrl ?? 'http://localhost:11434'
  }
  
  async isConnected(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch {
      return false
    }
  }
  
  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return data.models ?? []
    } catch (error) {
      console.error('Failed to list Ollama models:', error)
      return []
    }
  }
  
  create(): Provider {
    return createOpenAICompatible({
      baseURL: `${this.baseUrl}/v1`,
      apiKey: 'ollama',  // Ollama doesn't require API key but v1 format needs one
      headers: {
        'Authorization': 'Bearer ollama'
      }
    })
  }
  
  createModel(modelName: string): LanguageModel {
    return this.create().chatModel(modelName)
  }
}

// LMStudio provider
export interface LMStudioConfig {
  baseUrl?: string
  timeout?: number
}

export class LMStudioProvider {
  private baseUrl: string
  
  constructor(config: LMStudioConfig = {}) {
    this.baseUrl = config.baseUrl ?? 'http://localhost:1234/v1'
  }
  
  async isConnected(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch {
      return false
    }
  }
  
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      return (data.data ?? []).map((m: { id: string }) => m.id)
    } catch (error) {
      console.error('Failed to list LMStudio models:', error)
      return []
    }
  }
  
  create(): Provider {
    return createOpenAICompatible({
      baseURL: this.baseUrl,
      apiKey: 'not-required'  // LMStudio doesn't require auth
    })
  }
  
  createModel(modelName: string): LanguageModel {
    return this.create().chatModel(modelName)
  }
}

// Provider factory
export type SupportedProvider = 'anthropic' | 'openai' | 'google' | 'azure' | 'ollama' | 'lmstudio'

export interface ProviderInstance {
  name: SupportedProvider
  provider: Provider
  isConnected: () => Promise<boolean>
  listModels?: () => Promise<string[]>
}

export function createProvider(config: ProviderConfig): ProviderInstance | null {
  const { type, apiKey, baseUrl } = config
  
  switch (type) {
    case 'anthropic':
      if (!apiKey) return null
      return {
        name: 'anthropic',
        provider: createAnthropic({ apiKey }),
        isConnected: async () => true  // Will fail on first call if invalid
      }
    
    case 'openai':
      if (!apiKey) return null
      return {
        name: 'openai',
        provider: createOpenAI({ apiKey }),
        isConnected: async () => true
      }
    
    case 'google':
      if (!apiKey) return null
      return {
        name: 'google',
        provider: createGoogleGenerativeAI({ apiKey }),
        isConnected: async () => true
      }
    
    case 'azure':
      return {
        name: 'azure',
        provider: createAzure({ 
          apiKey: apiKey ?? '',
          baseURL: baseUrl ?? ''
        }),
        isConnected: async () => true
      }
    
    case 'ollama': {
      const ollama = new OllamaProvider({ baseUrl })
      return {
        name: 'ollama',
        provider: ollama.create(),
        isConnected: () => ollama.isConnected(),
        listModels: () => ollama.listModels().then(m => m.map(x => x.name))
      }
    }
    
    case 'lmstudio': {
      const lmstudio = new LMStudioProvider({ baseUrl })
      return {
        name: 'lmstudio',
        provider: lmstudio.create(),
        isConnected: () => lmstudio.isConnected(),
        listModels: () => lmstudio.listModels()
      }
    }
    
    default:
      return null
  }
}

// Auto-detect available local providers
export async function detectLocalProviders(): Promise<ProviderInstance[]> {
  const providers: ProviderInstance[] = []
  
  // Check Ollama
  try {
    const ollama = new OllamaProvider()
    if (await ollama.isConnected()) {
      providers.push({
        name: 'ollama',
        provider: ollama.create(),
        isConnected: () => ollama.isConnected(),
        listModels: () => ollama.listModels().then(m => m.map(x => x.name))
      })
    }
  } catch {}
  
  // Check LMStudio
  try {
    const lmstudio = new LMStudioProvider()
    if (await lmstudio.isConnected()) {
      providers.push({
        name: 'lmstudio',
        provider: lmstudio.create(),
        isConnected: () => lmstudio.isConnected(),
        listModels: () => lmstudio.listModels()
      })
    }
  } catch {}
  
  return providers
}