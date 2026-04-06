// Provider System - LLM Provider Adapters
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createAzure } from '@ai-sdk/azure'
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
      const data = await response.json() as { models?: OllamaModel[] }
      return data.models ?? []
    } catch (error) {
      console.error('Failed to list Ollama models:', error)
      return []
    }
  }
  
  create() {
    return createOpenAICompatible({
      name: 'ollama',
      baseURL: `${this.baseUrl}/v1`,
      apiKey: 'ollama'
    }) as any
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
      const data = await response.json() as { data?: Array<{ id: string }> }
      return (data.data ?? []).map((m) => m.id)
    } catch (error) {
      console.error('Failed to list LMStudio models:', error)
      return []
    }
  }
  
  create() {
    return createOpenAICompatible({
      name: 'lmstudio',
      baseURL: this.baseUrl,
      apiKey: 'not-required'
    }) as any
  }
}

// Provider factory
export type SupportedProvider = 'anthropic' | 'openai' | 'google' | 'azure' | 'ollama' | 'lmstudio'

export interface ProviderInstance {
  name: SupportedProvider
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
        isConnected: async () => true
      }
    
    case 'openai':
      if (!apiKey) return null
      return {
        name: 'openai',
        isConnected: async () => true
      }
    
    case 'google':
      if (!apiKey) return null
      return {
        name: 'google',
        isConnected: async () => true
      }
    
    case 'azure':
      return {
        name: 'azure',
        isConnected: async () => true
      }
    
    case 'ollama': {
      const ollama = new OllamaProvider({ baseUrl })
      return {
        name: 'ollama',
        isConnected: () => ollama.isConnected(),
        listModels: () => ollama.listModels().then(m => m.map(x => x.name))
      }
    }
    
    case 'lmstudio': {
      const lmstudio = new LMStudioProvider({ baseUrl })
      return {
        name: 'lmstudio',
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
        isConnected: () => lmstudio.isConnected(),
        listModels: () => lmstudio.listModels()
      })
    }
  } catch {}
  
  return providers
}
