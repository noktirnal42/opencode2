// Build script for OpenCode2
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { join } from 'path'

const outDir = join(process.cwd(), 'dist')

// Ensure output directory exists
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true })
}

// Simple build info
const buildInfo = {
  version: '2.0.0-alpha.1',
  timestamp: new Date().toISOString(),
  platform: process.platform,
  arch: process.arch,
  nodeVersion: process.version
}

writeFileSync(
  join(outDir, 'build.json'),
  JSON.stringify(buildInfo, null, 2)
)

console.log('Build complete!')
console.log('Output:', outDir)
console.log('Info:', JSON.stringify(buildInfo, null, 2))