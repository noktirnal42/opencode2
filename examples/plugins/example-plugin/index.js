// Example OpenCode2 Plugin
// This plugin demonstrates how to create plugins for OpenCode2

// Plugin tools
const tools = [
  {
    name: 'example-greet',
    description: 'Say hello to someone',
    inputSchema: {
      parse: (input) => input,
      schema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] }
    },
    execute: async (input) => {
      const { name } = input
      return {
        content: `Hello, ${name}! Welcome to OpenCode2!`
      }
    }
  },
  {
    name: 'example-date',
    description: 'Get the current date and time',
    inputSchema: {
      parse: (input) => input,
      schema: { type: 'object', properties: {} }
    },
    execute: async () => {
      const now = new Date()
      return {
        content: `Current date and time: ${now.toISOString()}`
      }
    }
  }
]

// Plugin agents
const agents = [
  {
    name: 'example-assistant',
    description: 'A friendly example assistant',
    systemPrompt: `You are Example Assistant, a friendly AI helper.

Guidelines:
- Be helpful and friendly
- Provide clear explanations
- Ask clarifying questions when needed`
  }
]

// Plugin skills
const skills = [
  {
    name: 'example-skill',
    description: 'A sample skill that demonstrates the skill system',
    execute: async (params, context) => {
      return {
        success: true,
        content: `Example skill executed in ${context.cwd}`
      }
    }
  }
]

// Plugin lifecycle hooks
async function onLoad() {
  console.log('Example plugin loaded!')
}

async function onUnload() {
  console.log('Example plugin unloaded.')
}

// Export plugin
export default {
  manifest: {
    name: 'example-plugin',
    version: '1.0.0',
    description: 'Example plugin demonstrating the OpenCode2 plugin system',
    main: 'index.js'
  },
  tools,
  agents,
  skills,
  onLoad,
  onUnload
}
