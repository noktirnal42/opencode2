# OpenCode2

> Open-source AI coding agent with multi-agent systems, Claude Code features, MCP integration, local model support, and desktop UI

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3-blue.svg)

## ✨ Features

### 🤖 Multi-Agent System
- **4 Primary Agents**: Jeeves (orchestrator), Apex (finance), Jewl (legal), Cypher (cyber)
- **50+ Specialized Sub-Agents** for every domain
- **Team Collaboration**: Create agent teams, send messages, coordinate tasks

### 🛠️ Claude Code-Compatible Tools
- **File Operations**: Read, write, edit files with precision
- **Shell Execution**: Run bash commands with permission controls
- **Search**: Grep, glob patterns for code exploration
- **Web Access**: Fetch pages, search the web
- **Task Management**: Todo lists, task tracking
- **Team Messaging**: Multi-agent communication

### 🔌 MCP Integration
- **Multiple Transports**: stdio, SSE, HTTP, WebSocket
- **OAuth Support**: Secure MCP server authentication
- **Server Management**: Connect to multiple MCP servers

### 💾 Memory & RAG
- **Semantic Search**: Find relevant memories using embeddings
- **Auto-Dream**: Background memory consolidation
- **Session Management**: Save, load, compact conversations

### 🖥️ Desktop UI
- **Transparency Control**: Adjustable window opacity
- **Blur Effects**: Modern frosted glass appearance
- **Always-on-Top**: Keep window visible
- **Keyboard Shortcuts**: Quick access to features

### 🔒 Security
- **Permission System**: Fine-grained tool access control
- **Dangerous Command Detection**: Protected shell operations
- **Mode-based Permissions**: default, acceptEdits, bypassPermissions, dontAsk, plan

### 🤖 Model Flexibility
- **Cloud Providers**: Anthropic, OpenAI, Google, Azure
- **Local Models**: Ollama, LMStudio (OpenAI-compatible)
- **Auto-Discovery**: Find available local models

### 📚 Skills System
- **Bundled Skills**: batch, debug, keybindings, loop, project-prompt, remember, review, simplify, verify
- **Custom Skills**: Add your own skill definitions
- **Skill Executor**: Run complex workflows

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/noktirnal42/opencode2.git
cd opencode2

# Install dependencies
npm install

# Build the project
npm run build

# Run the CLI
npm run cli

# Or use the desktop app
npm run desktop
```

## 📦 Installation

See [INSTALL.md](INSTALL.md) for detailed installation instructions.

## 🏗️ Project Structure

```
opencode2/
├── src/
│   ├── agent/         # Agent definitions and system prompts
│   ├── cli/          # Command-line interface
│   ├── config/       # Configuration management
│   ├── tool/         # Tool implementations
│   ├── skill/        # Skills system
│   ├── mcp/          # MCP client and server management
│   ├── memory/       # Memory and RAG system
│   ├── session/      # Session management
│   ├── provider/     # LLM provider integrations
│   ├── util/         # Utilities (permissions, etc.)
│   └── packages/
│       └── desktop-electron/  # Desktop UI
├── skills/
│   └── bundled/      # Bundled skill definitions
├── docs/             # Documentation
└── .github/          # GitHub configuration
```

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- Inspired by [Claude Code](https://claude.ai/code) by Anthropic
- Built on the shoulders of [OpenCode](https://opencode.dev/)
- Powered by modern AI language models

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/noktirnal42">noktirnal42</a>
</p>
