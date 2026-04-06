// OpenCode2 CLI - Functional Implementation
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { ConfigManager } from '@/config'
import { tools, type ToolContext } from '@/tool'
import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import * as readline from 'readline'
import * as path from 'path'
import * as fs from 'fs/promises'

const VERSION = '2.0.0-alpha.1'

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
}

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

function logError(message: string) {
  log(`Error: ${message}`, colors.red)
}

function logSuccess(message: string) {
  log(`✓ ${message}`, colors.green)
}

function logInfo(message: string) {
  log(message, colors.cyan)
}

// Format tool result for display
function formatToolResult(toolName: string, result: any): string {
  if (typeof result === 'string') {
    const truncated = result.length > 500 
      ? result.substring(0, 500) + '\n... (truncated)'
      : result
    return truncated
  }
  return JSON.stringify(result, null, 2)
}

// Interactive REPL mode
async function startRepl(agent: string, model: string, provider: string, apiKey: string) {
  const configManager = new ConfigManager()
  const config = await configManager.load()
  
  // Get agent system prompt
  const { jeevesAgent, apexAgent, buildAgent, planAgent } = await import('@/agent')
  
  const agents: Record<string, any> = {
    jeeves: jeevesAgent,
    apex: apexAgent,
    build: buildAgent,
    plan: planAgent,
  }
  
  const currentAgent = agents[agent] || agents.build
  const systemPrompt = currentAgent?.systemPrompt || 
    `You are ${agent}, an AI coding assistant. Help the user with their tasks.`

  log(`\n${colors.bright}OpenCode2 v${VERSION} - Interactive Mode${colors.reset}`)
  log(`${colors.dim}Agent: ${agent} | Model: ${model}${colors.reset}`)
  log(`${colors.dim}Type 'exit' to quit, 'clear' to clear history${colors.reset}\n`)

  // Messages history
  const messages: any[] = [
    { role: 'system', content: systemPrompt }
  ]

  // Create AI client - use direct SDK API
  const useAnthropic = provider === 'anthropic'

  // Tool execution function
  async function executeTool(toolName: string, input: any, context: ToolContext) {
    const tool = tools[toolName]
    if (!tool) {
      return { content: `Unknown tool: ${toolName}`, error: 'TOOL_NOT_FOUND' }
    }
    try {
      return await tool.execute(context, input)
    } catch (error) {
      return { 
        content: `Error executing ${toolName}: ${error instanceof Error ? error.message : String(error)}`,
        error: 'EXECUTION_ERROR'
      }
    }
  }

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${colors.green}→ ${colors.reset}`,
  })

  const toolContext: ToolContext = {
    cwd: process.cwd(),
    sessionId: `cli-${Date.now()}`,
    agent: {
      name: agent,
      mode: 'primary',
      permission: { allow: [], deny: [], ask: [] }
    },
    permissions: [],
  }

  // Handle user input
  async function processInput(input: string) {
    if (!input.trim()) return

    // Handle commands
    if (input.toLowerCase() === 'exit') {
      log('\nGoodbye! 👋')
      rl.close()
      process.exit(0)
    }

    if (input.toLowerCase() === 'clear') {
      messages.length = 1 // Keep system prompt
      console.clear()
      return
    }

    // Add user message
    messages.push({ role: 'user', content: input })

    try {
      // Show thinking indicator
      process.stdout.write(`${colors.dim}Thinking...${colors.reset}\n`)

      // Call AI using generateText API
      const toolDefs = Object.entries(tools).map(([name, tool]: [string, any]) => ({
        name,
        description: tool.description,
        parameters: tool.inputSchema,
      }))

      const result = await generateText({
        model: (useAnthropic ? anthropic(model) : openai(model)) as any,
        system: systemPrompt,
        messages: messages as any,
        tools: toolDefs as any,
        maxTokens: 4096,
        maxSteps: 5,
        onStepFinish: async ({ toolCalls, text }) => {
          // Execute tools if any
          if (toolCalls && toolCalls.length > 0) {
            for (const call of toolCalls) {
              if (call.toolName && call.args) {
                log(`\n${colors.yellow}[Calling tool: ${call.toolName}]${colors.reset}`)
                
                const toolResult = await executeTool(call.toolName, call.args, toolContext)
                
                log(`${colors.dim}${formatToolResult(call.toolName, toolResult)}${colors.reset}\n`)

                // Add tool result to messages for continuation
                messages.push({
                  role: 'tool' as const,
                  tool_call_id: call.toolCallId || `call-${Date.now()}`,
                  content: typeof toolResult === 'string' ? toolResult : JSON.stringify(toolResult),
                })
              }
            }
          }
          
          // Display text if available
          if (text) {
            console.log()
            log(text, colors.bright)
          }
        },
      })

      // Add final response to messages
      if (result.text) {
        messages.push({ role: 'assistant' as const, content: result.text })
      }

    } catch (error) {
      logError(error instanceof Error ? error.message : String(error))
      messages.pop() // Remove failed user message
    }
  }

  // Set prompt
  rl.prompt()

  rl.on('line', async (input) => {
    await processInput(input)
    rl.prompt()
  })

  rl.on('close', () => {
    log('\nGoodbye! 👋')
    process.exit(0)
  })
}

// Run single prompt
async function runPrompt(prompt: string, agent: string, model: string) {
  log(`\n${colors.bright}OpenCode2 v${VERSION}${colors.reset}`)
  log(`${colors.dim}Running single prompt mode...${colors.reset}\n`)

  const configManager = new ConfigManager()
  const config = await configManager.load()

  // Get provider config
  const anthropicConfig = config.providers.anthropic
  if (!anthropicConfig?.apiKey) {
    logError('No Anthropic API key configured. Set ANTHROPIC_API_KEY environment variable.')
    logInfo('Or configure in ~/.opencode/config.yaml')
    return
  }

  // Start REPL with the prompt
  const fullPrompt = `${prompt}\n\nPlease complete this task.`
  process.argv = ['node', 'opencode2', 'repl']
  
  // Add prompt to REPL
  console.log(`${colors.green}→ ${colors.reset}${prompt}`)
  
  // For single prompt, just run and exit
  try {
    const { jeevesAgent, buildAgent } = await import('@/agent')
    const agents: Record<string, any> = { jeeves: jeevesAgent, build: buildAgent }
    const currentAgent = agents[agent] || agents.build
    const systemPrompt = currentAgent?.systemPrompt || `You are ${agent}, an AI assistant.`

    // Use generateText API
    const result = await generateText({
      model: anthropic(model || 'claude-sonnet-4-20250514') as any,
      system: systemPrompt,
      prompt: prompt,
      maxTokens: 4096,
    })

    console.log()
    log(result.text || 'No response', colors.bright)
    
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error))
  }
}

// Models command
async function modelsCommand() {
  console.log()
  log(`OpenCode2 v${VERSION} - Available Models`, colors.bright)
  console.log('─'.repeat(40))
  
  const configManager = new ConfigManager()
  const config = await configManager.load()
  
  // List configured providers
  for (const [name, provider] of Object.entries(config.providers)) {
    console.log()
    log(`${name.toUpperCase()}:`, colors.cyan)
    if (provider.models) {
      for (const model of provider.models) {
        console.log(`  • ${model.name}`)
        if (model.contextLength) {
          console.log(`    Context: ${model.contextLength.toLocaleString()} tokens`)
        }
      }
    }
  }
  
  // Check local providers
  const { detectLocalProviders } = await import('@/provider')
  const localProviders = await detectLocalProviders()
  
  if (localProviders.length > 0) {
    console.log()
    log('LOCAL PROVIDERS:', colors.cyan)
    for (const p of localProviders) {
      logSuccess(`${p.name} (connected)`)
      if (p.listModels) {
        const models = await p.listModels()
        for (const m of models.slice(0, 10)) {
          console.log(`  • ${m}`)
        }
        if (models.length > 10) {
          console.log(`  ... and ${models.length - 10} more`)
        }
      }
    }
  }
  
  console.log()
}

// Providers command
async function providersCommand(argv: any) {
  if (!argv.list) {
    log('Use --list to see configured providers')
    return
  }

  console.log()
  log('OpenCode2 - Configured Providers', colors.bright)
  console.log('─'.repeat(40))
  
  const configManager = new ConfigManager()
  const config = await configManager.load()
  
  for (const [name, provider] of Object.entries(config.providers)) {
    console.log()
    log(`${name}:`, colors.cyan)
    console.log(`  Type: ${provider.type}`)
    console.log(`  API Key: ${provider.apiKey ? '✓ configured' : '✗ not set'}`)
    if (provider.baseUrl) console.log(`  Base URL: ${provider.baseUrl}`)
    if (provider.models) {
      console.log(`  Models: ${provider.models.map((m: any) => m.name).join(', ')}`)
    }
  }
  
  console.log()
}

// Interactive shell command
async function shellCommand(agent: string, model: string) {
  await startRepl(agent, model, 'anthropic', process.env.ANTHROPIC_API_KEY || '')
}

// Version command
function versionCommand() {
  console.log(`OpenCode2 version ${VERSION}`)
}

// Remote control command
async function remoteCommand(argv: any) {
  if (!argv.start && !argv.stop && !argv.status) {
    log('Use --start, --stop, or --status')
    return
  }

  if (argv.status) {
    // Check remote control status
    log('Remote control status: Available (use --start to enable)', colors.cyan)
    return
  }

  if (argv.start) {
    const { createRemoteControl } = await import('@/remote')
    const host = argv.host || 'localhost'
    const port = argv.port || 8080

    const remote = createRemoteControl({
      enabled: true,
      host,
      port,
      authToken: argv.token
    })

    try {
      await remote.connect()
      logSuccess(`Remote control started on ${host}:${port}`)
      log(`${colors.dim}Press Ctrl+C to stop${colors.reset}`)

      // Keep the process running
      process.on('SIGINT', async () => {
        await remote.disconnect()
        log('\nRemote control stopped.')
        process.exit(0)
      })
    } catch (error) {
      logError(`Failed to start remote control: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

// Main CLI setup
yargs(hideBin(process.argv))
  .scriptName('opencode2')
  .command(
    ['run [prompt]', '$0'],
    'Run a prompt with OpenCode2 (interactive mode if no prompt)',
    (yargs: any) => {
      return yargs
        .positional('prompt', {
          describe: 'The prompt to run',
          type: 'string'
        })
        .option('agent', {
          alias: 'a',
          describe: 'Agent to use (jeeves, apex, build, plan)',
          type: 'string',
          default: 'build'
        })
        .option('model', {
          alias: 'm',
          describe: 'Model to use',
          type: 'string'
        })
    },
    async (argv: any) => {
      if (argv.prompt) {
        await runPrompt(argv.prompt, argv.agent, argv.model || 'claude-sonnet-4-20250514')
      } else {
        await shellCommand(argv.agent, argv.model || 'claude-sonnet-4-20250514')
      }
    }
  )
  .command(
    'repl',
    'Start interactive REPL mode',
    (yargs: any) => {
      return yargs
        .option('agent', {
          alias: 'a',
          describe: 'Agent to use',
          type: 'string',
          default: 'build'
        })
        .option('model', {
          alias: 'm',
          describe: 'Model to use',
          type: 'string'
        })
    },
    async (argv: any) => {
      await shellCommand(argv.agent, argv.model || 'claude-sonnet-4-20250514')
    }
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
  .command(
    'remote',
    'Remote control mode',
    (yargs: any) => {
      return yargs
        .option('start', { type: 'boolean', describe: 'Start remote control server' })
        .option('stop', { type: 'boolean', describe: 'Stop remote control server' })
        .option('status', { type: 'boolean', describe: 'Check remote control status' })
        .option('host', { type: 'string', describe: 'Host to bind to', default: 'localhost' })
        .option('port', { type: 'number', describe: 'Port to bind to', default: 8080 })
        .option('token', { type: 'string', describe: 'Authentication token' })
    },
    remoteCommand
  )
  .help()
  .alias('help', 'h')
  .alias('version', 'v')
  .demandCommand(1, 'Specify a command')
  .parse()
