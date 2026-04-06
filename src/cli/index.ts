// OpenCode2 CLI
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { ConfigManager } from '@/config'
import { config } from 'process'

const VERSION = '2.0.0-alpha.1'

interface RunOptions {
  prompt?: string
  model?: string
  agent?: string
  stream?: boolean
}

async function runCommand(argv: RunOptions) {
  console.log('OpenCode2 v' + VERSION)
  console.log('─'.repeat(40))
  
  const configManager = new ConfigManager()
  const config = await configManager.load()
  
  console.log('Config loaded:', config.version)
  
  if (argv.agent) {
    console.log('Agent:', argv.agent)
  }
  
  if (argv.model) {
    console.log('Model:', argv.model)
  }
  
  if (argv.prompt) {
    console.log('Prompt:', argv.prompt)
    // TODO: Initialize session and run prompt
  }
  
  console.log('\nTip: Initialize a session with: opencode2 run "your prompt"')
}

interface ModelsOptions {}

async function modelsCommand(_argv: ModelsOptions) {
  console.log('Available Models:')
  console.log('─'.repeat(40))
  
  const configManager = new ConfigManager()
  const config = await configManager.load()
  
  // List configured providers
  for (const [name, provider] of Object.entries(config.providers)) {
    console.log(`\n${name}:`)
    if (provider.models) {
      for (const model of provider.models) {
        console.log(`  - ${model.name} (context: ${model.contextLength ?? 'N/A'})`)
      }
    }
  }
  
  // Check local providers
  const { detectLocalProviders } = await import('@/provider')
  const localProviders = await detectLocalProviders()
  
  if (localProviders.length > 0) {
    console.log('\nLocal Providers:')
    for (const p of localProviders) {
      console.log(`  - ${p.name} (connected)`)
      if (p.listModels) {
        const models = await p.listModels()
        for (const m of models.slice(0, 5)) {
          console.log(`    - ${m}`)
        }
      }
    }
  }
}

interface ProvidersOptions {
  add?: string
  remove?: string
  list?: boolean
}

async function providersCommand(argv: ProvidersOptions) {
  if (argv.list) {
    console.log('Configured Providers:')
    console.log('─'.repeat(40))
    
    const configManager = new ConfigManager()
    const config = await configManager.load()
    
    for (const [name, provider] of Object.entries(config.providers)) {
      console.log(`\n${name}:`)
      console.log(`  Type: ${provider.type}`)
      console.log(`  Has API Key: ${provider.apiKey ? 'yes' : 'no'}`)
      if (provider.baseUrl) console.log(`  Base URL: ${provider.baseUrl}`)
    }
  }
}

interface VersionOptions {}

function versionCommand(_argv: VersionOptions) {
  console.log(`OpenCode2 version ${VERSION}`)
}

const args = hideBin(process.argv)

yargs(args)
  .scriptName('opencode2')
  .version(VERSION)
  .describe('OpenCode2 - Open Source AI Coding Agent')
  .command(
    'run [prompt]',
    'Run a prompt with OpenCode2',
    (yargs) => {
      return yargs
        .positional('prompt', {
          describe: 'The prompt to run',
          type: 'string'
        })
        .option('agent', {
          alias: 'a',
          describe: 'Agent to use (build, plan)',
          type: 'string',
          default: 'build'
        })
        .option('model', {
          alias: 'm',
          describe: 'Model to use',
          type: 'string'
        })
    },
    runCommand
  )
  .command(
    'models',
    'List available models',
    {},
    modelsCommand
  )
  .command(
    'providers',
    'Manage providers',
    (yargs) => {
      return yargs
        .option('list', { alias: 'l', type: 'boolean', describe: 'List providers' })
        .option('add', { type: 'string', describe: 'Add provider' })
        .option('remove', { type: 'string', describe: 'Remove provider' })
    },
    providersCommand
  )
  .command(
    'version',
    'Show version',
    {},
    versionCommand
  )
  .help()
  .alias('help', 'h')
  .alias('version', 'v')
  .demandCommand()
  .parse()