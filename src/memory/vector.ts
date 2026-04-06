// Vector Memory Store for OpenCode2
// Provides semantic search using embeddings

import * as fs from 'fs/promises'
import * as path from 'path'
import { ulid } from 'ulid'

// Vector store configuration
export interface VectorStoreConfig {
  storeDir: string
  embeddingDim?: number
  metric?: 'cosine' | 'dot' | 'euclidean'
  topK?: number
}

// Memory entry with embedding
export interface VectorMemoryEntry {
  id: string
  content: string
  metadata: Record<string, unknown>
  embedding: number[]
  createdAt: number
  updatedAt: number
}

// Search result
export interface VectorSearchResult {
  entry: VectorMemoryEntry
  score: number
}

// Simple embedding function (placeholder - use real embeddings in production)
async function createEmbedding(text: string, dim: number = 1536): Promise<number[]> {
  // Generate a deterministic pseudo-embedding from text hash
  // In production, use OpenAI embeddings, local models, etc.
  const hash = await hashText(text)
  const embedding: number[] = []
  
  for (let i = 0; i < dim; i++) {
    // Create pseudo-embedding based on hash
    const seed = hash.charCodeAt(i % hash.length) / 255
    const wave = Math.sin(i * 0.1) * 0.5 + 0.5
    embedding.push((seed + wave * 0.1) / 1.1)
  }
  
  // Normalize
  const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0))
  return embedding.map(v => v / norm)
}

// Simple hash function
async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Vector store class
export class VectorStore {
  private entries: Map<string, VectorMemoryEntry> = new Map()
  private config: VectorStoreConfig
  private storePath: string

  constructor(config: VectorStoreConfig) {
    this.config = {
      embeddingDim: 1536,
      metric: 'cosine',
      topK: 5,
      ...config
    }
    this.storePath = path.join(config.storeDir, 'vectors.json')
  }

  // Initialize store
  async init(): Promise<void> {
    await fs.mkdir(this.config.storeDir, { recursive: true })
    await this.load()
  }

  // Load from disk
  async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.storePath, 'utf-8')
      const data = JSON.parse(content) as VectorMemoryEntry[]
      this.entries.clear()
      for (const entry of data) {
        this.entries.set(entry.id, entry)
      }
    } catch {
      // File doesn't exist, start fresh
    }
  }

  // Save to disk
  async save(): Promise<void> {
    const data = Array.from(this.entries.values())
    await fs.writeFile(this.storePath, JSON.stringify(data, null, 2), 'utf-8')
  }

  // Add entry with embedding
  async add(
    content: string,
    metadata: Record<string, unknown> = {}
  ): Promise<VectorMemoryEntry> {
    const embedding = await createEmbedding(content, this.config.embeddingDim)
    const now = Date.now()
    
    const entry: VectorMemoryEntry = {
      id: ulid(),
      content,
      metadata,
      embedding,
      createdAt: now,
      updatedAt: now
    }
    
    this.entries.set(entry.id, entry)
    await this.save()
    
    return entry
  }

  // Update entry
  async update(id: string, content: string, metadata?: Record<string, unknown>): Promise<boolean> {
    const entry = this.entries.get(id)
    if (!entry) return false

    const embedding = await createEmbedding(content, this.config.embeddingDim)
    
    entry.content = content
    entry.embedding = embedding
    entry.updatedAt = Date.now()
    
    if (metadata) {
      entry.metadata = { ...entry.metadata, ...metadata }
    }
    
    this.entries.set(id, entry)
    await this.save()
    
    return true
  }

  // Delete entry
  async delete(id: string): Promise<boolean> {
    const deleted = this.entries.delete(id)
    if (deleted) {
      await this.save()
    }
    return deleted
  }

  // Search by similarity
  async search(query: string, topK?: number): Promise<VectorSearchResult[]> {
    const queryEmbedding = await createEmbedding(query, this.config.embeddingDim)
    const k = topK ?? this.config.topK ?? 5
    
    const results: VectorSearchResult[] = []
    
    for (const entry of this.entries.values()) {
      const score = this.similarity(queryEmbedding, entry.embedding)
      results.push({ entry, score })
    }
    
    // Sort by score descending
    results.sort((a, b) => b.score - a.score)
    
    return results.slice(0, k)
  }

  // Search with filter
  async searchWithFilter(
    query: string,
    filter: (metadata: Record<string, unknown>) => boolean,
    topK?: number
  ): Promise<VectorSearchResult[]> {
    const queryEmbedding = await createEmbedding(query, this.config.embeddingDim)
    const k = topK ?? this.config.topK ?? 5
    
    const results: VectorSearchResult[] = []
    
    for (const entry of this.entries.values()) {
      if (!filter(entry.metadata)) continue
      
      const score = this.similarity(queryEmbedding, entry.embedding)
      results.push({ entry, score })
    }
    
    results.sort((a, b) => b.score - a.score)
    return results.slice(0, k)
  }

  // Calculate similarity
  private similarity(a: number[], b: number[]): number {
    if (this.config.metric === 'cosine' || !this.config.metric) {
      return this.cosineSimilarity(a, b)
    } else if (this.config.metric === 'dot') {
      return this.dotProduct(a, b)
    } else {
      return -this.euclideanDistance(a, b)
    }
  }

  // Cosine similarity
  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    return dot / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  // Dot product
  private dotProduct(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0)
  }

  // Euclidean distance
  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0))
  }

  // Get all entries
  getAll(): VectorMemoryEntry[] {
    return Array.from(this.entries.values())
  }

  // Get entry by ID
  get(id: string): VectorMemoryEntry | undefined {
    return this.entries.get(id)
  }

  // Get entry count
  size(): number {
    return this.entries.size
  }

  // Clear all entries
  async clear(): Promise<void> {
    this.entries.clear()
    await this.save()
  }
}

// Factory function
export function createVectorStore(workspacePath: string, config?: Partial<VectorStoreConfig>): VectorStore {
  const storeDir = path.join(workspacePath, '.opencode', 'vectors')
  return new VectorStore({ storeDir, ...config })
}

// Hybrid search combining keyword and semantic
export async function hybridSearch(
  store: VectorStore,
  query: string,
  keywordBoost: number = 0.3,
  semanticBoost: number = 0.7,
  topK: number = 5
): Promise<VectorSearchResult[]> {
  const semanticResults = await store.search(query, topK * 2)
  
  // Simple keyword matching
  const queryTerms = query.toLowerCase().split(/\s+/)
  const scoredResults: VectorSearchResult[] = []
  
  for (const result of semanticResults) {
    const content = result.entry.content.toLowerCase()
    let keywordScore = 0
    
    for (const term of queryTerms) {
      if (content.includes(term)) {
        keywordScore += 1
      }
    }
    
    keywordScore = keywordScore / queryTerms.length
    
    // Combine scores
    const combinedScore = keywordScore * keywordBoost + result.score * semanticBoost
    scoredResults.push({
      entry: result.entry,
      score: combinedScore
    })
  }
  
  return scoredResults.sort((a, b) => b.score - a.score).slice(0, topK)
}
