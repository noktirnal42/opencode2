// OpenCode2 CLI
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { ConfigManager } from '@/config'

const VERSION = '2.0.0-alpha.1'

async function runCommand(argv: any) {
  console.log('OpenCode2 v' + VERSION)
  console.log('─'.repeat(40))
  
  const configManager = new ConfigManager()
  const cfg = await configManager.load()
  
  console.log('Config loaded:', cfg.version)
  
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

async function modelsCommand() {
  console.log('Available Models:')
  console.log('─'.repeat(40))
  
  const configManager = new ConfigManager()
  const cfg = await configManager.load()
  
  // List configured providers
  for (const [name, provider] of Object.entries(cfg.providers)) {
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

async function providersCommand(argv: any) {
  if (argv.list) {
    console.log('Configured Providers:')
    console.log('─'.repeat(40))
    
    const configManager = new ConfigManager()
    const cfg = await configManager.load()
    
    for (const [name, provider] of Object.entries(cfg.providers)) {
      console.log(`\n${name}:`)
      console.log(`  Type: ${provider.type}`)
      console.log(`  Has API Key: ${provider.apiKey ? 'yes' : 'no'}`)
      if (provider.baseUrl) console.log(`  Base URL: ${provider.baseUrl}`)
    }
  }
}

function versionCommand() {
  console.log(`OpenCode2 version ${VERSION}`)
}

// Main CLI setup
yargs(hideBin(process.argv))
  .scriptName('opencode2')
  .command(
    'run [prompt]',
    'Run a prompt with OpenCode2',
    (yargs: any) => {
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
    () => {},
    modelsCommand
  )
  .command(
    'providers',
    'Manage providers',
    (yargs: any) => {
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
    () => {},
    versionCommand
  )
  .help()
  .alias('help', 'h')
  .demandCommand()
  .parse()
