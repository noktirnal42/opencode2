# Installation & Build Guide

This guide covers how to install, build, and set up OpenCode2 for development and production use.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Build](#build)
4. [Configuration](#configuration)
5. [Running](#running)
6. [Desktop UI](#desktop-ui)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required

| Dependency | Version | Notes |
|-----------|---------|-------|
| **Bun** | 1.0+ | Recommended runtime |
| **Node.js** | 18+ | Alternative to Bun |
| **Git** | 2.0+ | Version control |

### Optional

| Dependency | Purpose |
|-----------|---------|
| **Ollama** | Local LLM inference |
| **LMStudio** | Local LLM with OpenAI-compatible API |
| **Docker** | Containerized MCP servers |

### Installing Bun

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# Via npm
npm install -g bun
```

### Installing Node.js

```bash
# macOS
brew install node

# Linux (via nvm)
nvm install 20

# Windows
# Download from nodejs.org
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/opencode-ai/OpenCode2.git
cd OpenCode2/OpenCode2
```

### 2. Install Dependencies

```bash
# Using Bun (recommended)
bun install

# Using npm
npm install

# Using yarn
yarn install
```

### 3. Verify Installation

```bash
bun run --version
```

---

## Build

### Development Build

```bash
# TypeScript type checking
bun run typecheck

# Run in development mode
bun run dev

# Watch mode (auto-rebuild)
bun run dev:watch
```

### Production Build

```bash
# Build for production
bun run build

# Output will be in dist/ directory
```

### Build Script

The build script at `script/build.ts` generates:

- `dist/build.json` — Build metadata
- Compiled TypeScript output

```bash
# Run build script
bun run script/build.ts
```

---

## Configuration

### 1. Create Config Directory

```bash
mkdir -p ~/.opencode
```

### 2. Create Configuration File

Create `~/.opencode/config.json`:

```json
{
  "version": "2.0",
  "providers": {
    "anthropic": {
      "type": "anthropic",
      "apiKey": "${ANTHROPIC_API_KEY}",
      "models": [
        { "name": "claude-sonnet-4-20250514" }
      ]
    },
    "openai": {
      "type": "openai",
      "apiKey": "${OPENAI_API_KEY}"
    }
  },
  "agents": {
    "build": { "model": "claude-sonnet-4-20250514" },
    "plan": { "model": "claude-haiku-3-5" }
  },
  "memory": {
    "autoMemory": true,
    "autoDream": {
      "enabled": true,
      "minHours": 24,
      "minSessions": 5
    }
  },
  "localModels": {
    "ollama": { "enabled": true },
    "lmstudio": { "enabled": true }
  }
}
```

### 3. Set API Keys

```bash
# Option 1: Environment variables
export ANTHROPIC_API_KEY="your-key-here"
export OPENAI_API_KEY="your-key-here"

# Option 2: In config (not recommended for production)
# Add "apiKey": "your-key-here" to provider config
```

---

## Running

### CLI Usage

```bash
# Show help
bun run src/cli/index.ts --help

# Run a prompt
bun run src/cli/index.ts run "Hello, world!"

# List models
bun run src/cli/index.ts models

# List providers
bun run src/cli/index.ts providers --list
```

### Command Reference

| Command | Description |
|---------|-------------|
| `run [prompt]` | Run a prompt with the AI |
| `models` | List available models |
| `providers` | Manage LLM providers |
| `version` | Show version |

### Options

```bash
# Specify agent
bun run src/cli/index.ts run "Analyze this" --agent plan

# Specify model
bun run src/cli/index.ts run "Code review" --model gpt-4o

# Non-interactive mode
bun run src/cli/index.ts run "Fix the bug" --no-stream
```

---

## Desktop UI

### Installation

```bash
cd packages/desktop-electron
bun install
```

### Development

```bash
cd packages/desktop-electron
bun run dev
```

### Build

```bash
cd packages/desktop-electron
bun run build
```

### Features

- **Window Transparency** — Adjust opacity with slider
- **Background Blur** — macOS vibrancy effect
- **Always on Top** — Pin window above others
- **Keyboard Shortcut** — Cmd+Shift+T to toggle transparency

---

## Configuration Files

### Per-Project Config

Create `.opencode/config.json` in your project:

```json
{
  "agents": {
    "build": {
      "model": "claude-sonnet-4-20250514"
    }
  },
  "permissions": {
    "defaultMode": "ask"
  }
}
```

### Agent Definitions

Create custom agents in `~/.opencode/agents/`:

```yaml
# my-agent.yaml
name: my-agent
description: Custom agent for specific tasks
model: claude-sonnet-4-20250514
mode: primary
permission:
  allow: [read, write, edit, bash]
  deny: [rm -rf /]
tools:
  - read
  - write
  - edit
  - bash
```

### Skills

Create skills in `~/.opencode/skills/`:

```markdown
---
name: custom-skill
description: What this skill does
when: /custom-skill
tools: [read, bash]
---
Your skill content here...
```

### MCP Servers

Configure MCP servers in `~/.opencode/mcp.json`:

```json
{
  "servers": [
    {
      "name": "filesystem",
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "./"]
    }
  ]
}
```

---

## Troubleshooting

### Common Issues

#### "Command not found"

```bash
# Make sure you're in the project directory
cd ~/dev/OpenCode2/OpenCode2

# Try running with bun explicitly
bun run src/cli/index.ts
```

#### "API key not found"

```bash
# Set environment variable
export ANTHROPIC_API_KEY="your-key"

# Or use local models instead
# Configure Ollama or LMStudio in config
```

#### TypeScript errors

```bash
# Reinstall dependencies
rm -rf node_modules bun.lockb
bun install

# Type check
bun run typecheck
```

### Debug Mode

```bash
# Enable verbose logging
export DEBUG=opencode2:*
bun run src/cli/index.ts run "test"
```

### Reset Configuration

```bash
# Backup and reset
cp ~/.opencode/config.json ~/.opencode/config.json.bak
rm ~/.opencode/config.json

# Restart with fresh config
```

---

## Updating

### Pull Latest Changes

```bash
git pull origin dev

# Update dependencies
bun install

# Rebuild
bun run build
```

### Version Check

```bash
bun run src/cli/index.ts version
```

---

## Uninstallation

```bash
# Remove project files
rm -rf ~/dev/OpenCode2/OpenCode2

# Remove configuration
rm -rf ~/.opencode

# Remove desktop app
rm -rf ~/Applications/OpenCode2.app  # macOS
```

---

## Next Steps

1. ✅ Read this installation guide
2. 📖 Review [README.md](README.md) for features
3. 🔧 Configure your providers
4. 🚀 Try running a prompt
5. 📚 Explore [docs/spec.md](../docs/spec.md) for technical details

---

**Need help?** Open an issue on GitHub or check the documentation.
