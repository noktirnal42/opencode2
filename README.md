# OpenCode2 🎩

**The Ultimate Open Source AI Coding Agent**

OpenCode2 is a fusion of OpenCode Desktop and Claude Code — a 100% open source AI coding agent that combines the best features from both projects with extended capabilities for professional development workflows.

---

## 🌟 What is OpenCode2?

OpenCode2 is an advanced AI-powered coding assistant designed for professional developers, teams, and organizations. Unlike closed-source alternatives, OpenCode2 is completely open source, extensible, and designed to work with any LLM provider.

### Key Features

- **🤖 40+ Built-in Tools** — Read, write, edit, bash, grep, glob, LSP, MCP, web search, and more
- **👥 Multi-Agent System** — Jeeves (orchestrator), Apex (finance), Jewl (legal), Cypher (cyber), plus 50+ specialized sub-agents
- **🧠 Memory with RAG** — Automatic memory consolidation, project context awareness
- **🔌 MCP Integration** — Connect to Model Context Protocol servers
- **💾 Skills System** — Markdown-based skills with frontmatter configuration
- **☁️ Multi-Cloud Support** — AWS, GCP, Azure, plus local models (Ollama, LMStudio)
- **🖥️ Desktop UI** — Window transparency, blur effects, always-on-top
- **📊 Permission System** — Granular permission controls with multiple modes

---

## 🎯 Purpose & Scope

### What OpenCode2 Does

1. **Code Assistance** — Write, edit, refactor, and debug code with AI assistance
2. **Multi-Agent Orchestration** — Deploy specialized agents for different tasks
3. **Project Analysis** — Understand codebases with RAG-powered memory
4. **Tool Integration** — Extend capabilities via MCP servers and custom tools
5. **Enterprise Ready** — Permission controls, audit trails, local model support

### Target Users

| User Type | Use Case |
|-----------|----------|
| **Individual Developers** | Daily coding assistance, code review, debugging |
| **Development Teams** | Multi-agent workflows, shared memory, team coding standards |
| **Organizations** | Enterprise security, local models, compliance |
| **Specialists** | Domain-specific agents (finance, legal, cybersecurity) |

---

## 📁 Project Structure

```
OpenCode2/
├── src/
│   ├── agent/           # Agent definitions & orchestration
│   │   ├── agents.ts   # All agent definitions (50+ agents)
│   │   └── index.ts    # Agent system exports
│   ├── cli/            # Command-line interface
│   ├── config/         # Configuration management
│   ├── provider/        # LLM provider adapters
│   │   └── index.ts    # Ollama, LMStudio, Anthropic, OpenAI, etc.
│   ├── tool/           # Tool implementations (40+ tools)
│   │   ├── read.ts     # File reading
│   │   ├── write.ts    # File writing
│   │   ├── edit.ts     # File editing
│   │   ├── bash.ts     # Shell commands
│   │   ├── grep.ts     # Text search
│   │   ├── glob.ts     # File patterns
│   │   ├── webfetch.ts # Web fetching
│   │   ├── websearch.ts # Web search
│   │   └── index.ts    # Tool registry
│   ├── skill/          # Skills system
│   │   ├── loader.ts   # Skill discovery
│   │   ├── executor.ts # Skill execution
│   │   └── types.ts    # Skill definitions
│   ├── mcp/            # MCP integration
│   │   ├── client.ts   # MCP server manager
│   │   └── types.ts    # MCP types
│   ├── memory/         # Memory system with RAG
│   │   ├── rag.ts      # RAG implementation
│   │   └── types.ts    # Memory types
│   ├── session/         # Session management
│   │   ├── manager.ts # Session persistence
│   │   └── types.ts   # Session types
│   └── types/          # Shared type definitions
├── packages/
│   └── desktop-electron/ # Desktop UI with transparency
├── skills/
│   └── bundled/        # Built-in skills
│       ├── project-prompt.md
│       ├── simplify.md
│       ├── debug.md
│       ├── verify.md
│       ├── batch.md
│       ├── loop.md
│       ├── review.md
│       ├── remember.md
│       └── keybindings.md
├── docs/               # Documentation (in parent)
│   ├── spec.md        # Full specification
│   └── plan.md        # Implementation roadmap
├── package.json
├── tsconfig.json
└── .gitignore
```

---

## 🚀 Quick Start

### Prerequisites

- **Bun** (recommended) or **Node.js 18+**
- **TypeScript** knowledge
- **LLM API Key** (optional, for cloud models)

### Installation

```bash
# Clone the repository
git clone https://github.com/opencode-ai/OpenCode2.git
cd OpenCode2

# Install dependencies
bun install

# Build the project
bun run build

# Run the CLI
bun run src/cli/index.ts --help
```

### Usage

```bash
# Run a prompt
bun run src/cli/index.ts run "Write a hello world in Python"

# List available models
bun run src/cli/index.ts models

# Check providers
bun run src/cli/index.ts providers --list
```

---

## 🎨 Agent System

### Primary Agents

| Agent | Emoji | Role | Invocation |
|-------|-------|------|-----------|
| **Jeeves** | 🎩 | Master orchestrator | Direct invocation |
| **Apex** | 📊 | Financial strategist | "Consult Apex on..." |
| **Jewl** | ⚖️ | Legal expert | "Have Jewl review..." |
| **Cypher** | 🔐 | Cybersecurity | "Ask Cypher to..." |
| **Build** | 🔨 | Development | Default agent |
| **Plan** | 📋 | Read-only analysis | Plan mode |

### Sub-Agents (50+)

#### Jeeves' Team
- Code Architect, Sound Engineer, QA Specialist
- Research Analyst, DevOps Engineer, UI/UX Designer

#### Apex' Team
- Portfolio Architect, Tax Strategist, Market Analyst
- DeFi Specialist, Risk Manager, Budget Coach, Crypto Analyst

#### Jewl' Team
- Legal Researcher, Drafting Specialist, Strategic Advisor
- Compliance Officer, IP Specialist, Constitutional Scholar

#### Cypher' Team
- Binary Surgeon, Network Pathfinder, Hardware Hacker
- Exploit Architect, Forensics Expert, Kernel Specialist

#### Specialist Agents
- Cloud: AWS Architect, GCP Architect, Azure Architect
- Database: SQL DBA, NoSQL Specialist, Data Engineer
- Mobile: iOS, Android, Cross-Platform Developers
- Data: Data Scientist, ML Engineer, Data Analyst
- And 25+ more specialized agents

---

## 🛠️ Tool System

### Core Tools

| Tool | Description |
|------|-------------|
| `read` | Read file contents |
| `write` | Write/create files |
| `edit` | Edit files with find/replace |
| `bash` | Execute shell commands |
| `grep` | Search for text in files |
| `glob` | Find files by pattern |
| `webfetch` | Fetch web page content |
| `websearch` | Search the web |

### Tool Features

- **Zod Schema Validation** — All tools use strict input validation
- **Permission System** — Tools respect permission rules
- **Error Handling** — Consistent error format across all tools
- **Context Aware** — Tools receive session context

---

## 🧠 Memory System

### RAG-Powered Memory

```typescript
// Automatic memory retrieval
const memories = await findRelevantMemories(
  workspacePath,
  "How is authentication handled?"
)
```

### Auto-Dream

Background memory consolidation that runs:
- After 24 hours (configurable)
- After 5 sessions (configurable)
- Uses LLM to extract and store relevant information

### Memory Structure

```
.workspace/
└── .opencode/
    └── memory/
        ├── MEMORY.md      # Main memory file
        └── *.md          # Topic files
```

---

## 🔌 MCP Integration

### Supported Transports

- **stdio** — Local process communication
- **sse** — Server-Sent Events
- **http** — REST API
- **ws** — WebSocket

### Example Configuration

```yaml
mcp:
  servers:
    - name: filesystem
      type: stdio
      command: npx
      args: ["@modelcontextprotocol/server-filesystem", "/path"]
    - name: github
      type: http
      url: https://api.github.com
```

---

## ☁️ Provider Support

### Cloud Providers

| Provider | Status | Models |
|----------|--------|--------|
| Anthropic | ✅ | Claude 3.5, 3.0 |
| OpenAI | ✅ | GPT-4o, GPT-4, GPT-3.5 |
| Google | ✅ | Gemini Pro, Flash |
| Azure | ✅ | GPT-4, GPT-3.5 |

### Local Providers

| Provider | Status | Notes |
|---------|--------|-------|
| Ollama | ✅ | Auto-discovery |
| LMStudio | ✅ | OpenAI-compatible |

```typescript
// Local model configuration
localModels:
  ollama:
    enabled: true
    baseUrl: http://localhost:11434
  lmstudio:
    enabled: true
    baseUrl: http://localhost:1234/v1
```

---

## 🖥️ Desktop UI

### Transparency Controls

- **Opacity Slider** — 30% to 100% transparency
- **Background Blur** — macOS vibrancy effect
- **Always on Top** — Pin window above others
- **Keyboard Shortcut** — Cmd+Shift+T to toggle

### Features

- Native title bar controls
- Window state persistence
- System tray integration (planned)

---

## 📋 Configuration

### Global Config

Located at `~/.opencode/config.json`:

```json
{
  "version": "2.0",
  "providers": {
    "anthropic": {
      "type": "anthropic",
      "apiKey": "${ANTHROPIC_API_KEY}"
    }
  },
  "agents": {
    "build": {
      "model": "claude-sonnet-4-20250514"
    }
  },
  "memory": {
    "autoMemory": true,
    "autoDream": {
      "enabled": true,
      "minHours": 24,
      "minSessions": 5
    }
  },
  "compaction": {
    "enabled": true,
    "maxTokens": 200000
  },
  "localModels": {
    "ollama": {
      "enabled": true
    }
  }
}
```

---

## 🔒 Permission System

### Permission Modes

| Mode | Behavior |
|------|----------|
| `default` | Ask for dangerous, allow safe |
| `acceptEdits` | Auto-accept file edits |
| `bypassPermissions` | Skip all checks |
| `dontAsk` | Never ask |
| `plan` | Read-only mode |

### Permission Rules

```typescript
// Example permission evaluation
const result = evaluator.evaluate('bash', 'rm -rf /tmp/test')
// { allowed: true, requiresConfirmation: true, reason: 'Dangerous command' }
```

---

## 🎓 Skills System

### Built-in Skills

| Skill | Trigger | Description |
|-------|---------|-------------|
| Project Analysis | `/project-prompt` | Analyze codebase structure |
| Simplify | `/simplify` | Refactor complex code |
| Debug | `/debug` | Help debug issues |
| Verify | `/verify` | Run tests and checks |
| Remember | `/remember` | Store important info |

### Custom Skills

Create skills in `~/.opencode/skills/`:

```markdown
---
name: my-skill
description: What this skill does
when: /my-skill
tools: [read, bash]
---
Your skill content here...
```

---

## 📊 Roadmap

See [docs/plan.md](docs/plan.md) for the full 46-week implementation roadmap.

### Current Phase

- ✅ Core tool system
- ✅ Agent system (50+ agents)
- ✅ Skills system
- ✅ MCP integration
- ✅ Memory with RAG
- ✅ Ollama/LMStudio support
- ✅ Desktop UI with transparency

### Next Phases

1. Additional tools (Task, Team, LSP)
2. Enhanced permission system
3. Plugin system
4. Remote control
5. Voice mode (optional)

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) in the parent directory for:

- Git workflow guidelines
- Branch naming conventions
- Commit message format
- Pull request process

### Quick Development

```bash
# Create feature branch
git checkout -b feature/your-feature dev

# Make changes, commit
git add .
git commit -m "feat(scope): description"

# Push and create PR
git push -u origin feature/your-feature
```

---

## 📄 License

MIT License — see LICENSE file for details.

---

## 🙏 Acknowledgments

- **OpenCode** — Base architecture and CLI design
- **Claude Code** — Feature inspiration (tools, skills, agents, memory)
- **Vercel AI SDK** — Provider abstraction layer
- **Model Context Protocol** — MCP standard integration

---

## 📞 Support

- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Documentation:** This README and `docs/` folder

---

**Built with ❤️ by the OpenCode2 team**
**Version 2.0.0-alpha.1**
