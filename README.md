# ⚡ Yuzz CLI

<div align="center">

```
  ██╗   ██╗██╗   ██╗███████╗███████╗
  ╚██╗ ██╔╝██║   ██║╚══███╔╝╚══███╔╝
   ╚████╔╝ ██║   ██║  ███╔╝   ███╔╝
    ╚██╔╝  ██║   ██║ ███╔╝   ███╔╝
     ██║   ╚██████╔╝███████╗███████╗
     ╚═╝    ╚═════╝ ╚══════╝╚══════╝
```

**AI-powered terminal chat CLI using 100% free AI models**

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![Version](https://img.shields.io/badge/version-1.1.0-blue)](package.json)

</div>

---

## ⚠️ IMPORTANT NOTICE

**🚫 STRICTLY PROHIBITED: This software is FREE and open source. You are ABSOLUTELY FORBIDDEN from selling, distributing for profit, or commercializing this project in any way without explicit permission from the original author. Violations will be pursued legally.**

---

## ✨ Features

- 🆓 **100% Free** — Google Gemini free tier & free OpenRouter models
- 🎨 **Beautiful UI** — gradient logo, colored output, markdown in terminal
- 📱 **Terminal-first** — Termius, Termux, iTerm2, WSL, any shell
- 💬 **Persistent history** — saved between sessions
- 🔄 **Auto-updater** — `yuzz update` patches files in-place from GitHub
- 🔧 **Repair mode** — `yuzz repair` re-downloads all source files
- 🔌 **Multi-provider** — Gemini + OpenRouter (Mistral, Llama3, Qwen, DeepSeek...)
- 🧠 **Markdown rendering** — code blocks, headings, lists rendered in terminal

---

## 🚀 Quick Start

### 1. Install

```bash
# Clone from GitHub
git clone https://github.com/YOUR_USERNAME/yuzz-cli.git
cd yuzz-cli
npm install
npm link          # makes 'yuzz' available globally
```

Or via npm (once published):
```bash
npm install -g yuzz-cli
```

### 2. Get a FREE API Key

**Option A — Google Gemini (easiest):**
1. Visit [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with Google → Click **"Create API Key"**

**Option B — OpenRouter (many free models):**
1. Visit [https://openrouter.ai](https://openrouter.ai)
2. Sign up → Keys → Create new key

### 3. Save Your Key

```bash
yuzz set-key gemini YOUR_API_KEY
# or
yuzz set-key openrouter YOUR_API_KEY
```

### 4. Chat!

```bash
yuzz
```

---

## 📱 Termux Setup

```bash
pkg update && pkg install nodejs git
git clone https://github.com/YOUR_USERNAME/yuzz-cli.git
cd yuzz-cli && npm install && npm link
yuzz set-key gemini YOUR_KEY
yuzz
```

---

## 💡 Commands

### In-chat

| Command | Description |
|---------|-------------|
| `/help` | Show help |
| `/clear` | Clear screen & reset chat |
| `/history` | Show recent messages |
| `/models` | List available AI models |
| `/system <text>` | Set custom system prompt |
| `/update` | Update Yuzz to latest version |
| `/repair` | Re-download all source files |
| `/exit` / `/quit` | Exit |

### CLI

```bash
yuzz                            # Start chat
yuzz --model=flash-thinking     # Gemini reasoning model
yuzz --provider=openrouter      # Use OpenRouter
yuzz --provider=openrouter --model=deepseek  # DeepSeek R1 (free)
yuzz update                     # Update to latest version
yuzz repair                     # Force re-download all source files
yuzz config                     # Show current config
yuzz set-key gemini <KEY>       # Save Gemini key
yuzz set-key openrouter <KEY>   # Save OpenRouter key
yuzz clear-history              # Clear history
yuzz --version                  # Show version
yuzz --help                     # Show all flags
```

---

## 🤖 Models

### Google Gemini (Free)

| Alias | Model | Notes |
|-------|-------|-------|
| `flash` | gemini-2.0-flash | ⚡ Default |
| `flash-lite` | gemini-2.0-flash-lite | 🪶 Fastest |
| `flash-thinking` | gemini-2.0-flash-thinking-exp | 🧠 Reasoning |
| `pro` | gemini-1.5-pro | 💎 Pro |
| `1.5-flash` | gemini-1.5-flash | ⚡ 1.5 Flash |

### OpenRouter (Free)

| Alias | Notes |
|-------|-------|
| `mistral` | 🌟 Default for OR |
| `llama3` / `llama3-8b` | 🦙 Meta Llama |
| `gemma` | 💫 Google Gemma |
| `qwen` | 🐉 Alibaba Qwen |
| `deepseek` | 🔭 Reasoning |
| `phi3` | ⚡ Microsoft Phi-3 |

---

## 🔄 Updating

```bash
# Check and update in-place (patches source files directly)
yuzz update

# Force re-download all files (useful after errors)
yuzz repair
```

The updater fetches the latest source files from GitHub's `main` branch and writes them directly to your local installation — no need to re-clone or reinstall.

---

## 🛠️ Development

```bash
git clone https://github.com/YOUR_USERNAME/yuzz-cli.git
cd yuzz-cli && npm install
node src/index.js
```

### Structure

```
yuzz-cli/
├── src/
│   ├── index.js          # Main entry + chat loop
│   ├── config.js         # Configuration (conf)
│   ├── ui.js             # Terminal UI rendering
│   ├── history.js        # Chat history persistence
│   ├── updater.js        # Auto-updater / repair
│   └── providers/
│       ├── gemini.js     # Google Gemini API
│       └── openrouter.js # OpenRouter API
├── package.json
├── README.md
└── LICENSE
```

---

## 📜 License

MIT © 2026 Yuzz Contributors

---

<div align="center">Made with ❤️ for terminal lovers</div>
