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
[![Free AI](https://img.shields.io/badge/AI-100%25%20Free-blue)](https://aistudio.google.com)

</div>

---

## ✨ Features

- 🆓 **100% Free** — uses Google Gemini free tier & free OpenRouter models
- 🎨 **Beautiful UI** — gradient logos, colored output, markdown rendering
- 📱 **Terminal-first** — works great in Termius, Termux, iTerm2, WSL, etc.
- 💬 **Persistent history** — saves conversation between sessions
- 🔌 **Multi-provider** — Gemini (default) + OpenRouter (Mistral, Llama3, Qwen, DeepSeek...)
- 🧠 **Markdown rendering** — code blocks, headings, bold, lists rendered in terminal
- ⚡ **Fast** — minimal dependencies, instant startup

---

## 🚀 Quick Start

### 1. Install

```bash
# Via npm (recommended)
npm install -g yuzz-cli

# Or clone from GitHub
git clone https://github.com/yuzzoffc/yuzzcli.git
cd yuzzcli
npm install
npm link
```

### 2. Get a FREE API Key

**Option A — Google Gemini (recommended, easiest):**
1. Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with Google
3. Click **"Create API Key"** → Copy it

**Option B — OpenRouter (access to many models):**
1. Go to [https://openrouter.ai](https://openrouter.ai)
2. Sign up → Go to Keys → Create new key

### 3. Save Your Key

```bash
# For Gemini
yuzz set-key gemini YOUR_API_KEY_HERE

# For OpenRouter
yuzz set-key openrouter YOUR_API_KEY_HERE
```

### 4. Start Chatting!

```bash
yuzz
```

---

## 📱 Termux Setup

```bash
# Install Node.js in Termux
pkg update && pkg install nodejs

# Install Yuzz
npm install -g yuzz-cli

# Set your key and chat
yuzz set-key gemini YOUR_KEY
yuzz
```

---

## 💡 Commands

### In-chat Commands

| Command | Description |
|---------|-------------|
| `/help` | Show help |
| `/clear` | Clear screen & reset chat |
| `/history` | Show recent conversation |
| `/models` | List available AI models |
| `/system <prompt>` | Set custom system prompt |
| `/exit` or `/quit` | Exit Yuzz |

### CLI Flags

```bash
yuzz                          # Start chat (default: Gemini flash)
yuzz --model=flash-thinking   # Use Gemini reasoning model
yuzz --provider=openrouter    # Use OpenRouter
yuzz --provider=openrouter --model=llama3  # OpenRouter + Llama3
yuzz config                   # Show current configuration
yuzz set-key gemini <KEY>     # Save Gemini API key
yuzz set-key openrouter <KEY> # Save OpenRouter API key
yuzz clear-history            # Clear saved history
yuzz --help                   # Show all flags
yuzz --version                # Show version
```

---

## 🤖 Available Models

### Google Gemini (Free Tier)

| Alias | Model | Notes |
|-------|-------|-------|
| `flash` | gemini-2.0-flash | ⚡ Default, fast & capable |
| `flash-lite` | gemini-2.0-flash-lite | 🪶 Ultra-fast |
| `flash-thinking` | gemini-2.0-flash-thinking-exp | 🧠 Reasoning |
| `pro` | gemini-1.5-pro | 💎 Pro model |
| `1.5-flash` | gemini-1.5-flash | ⚡ 1.5 Flash |

### OpenRouter (Free Models)

| Alias | Model | Notes |
|-------|-------|-------|
| `mistral` | mistral-7b-instruct | 🌟 Default for OR |
| `llama3` | llama-3.2-3b | 🦙 Meta Llama |
| `llama3-8b` | llama-3.1-8b | 🦙 Llama 8B |
| `gemma` | gemma-3-4b | 💫 Google Gemma |
| `qwen` | qwen-2.5-7b | 🐉 Alibaba Qwen |
| `deepseek` | deepseek-r1 | 🔭 Reasoning |
| `phi3` | phi-3-mini | ⚡ Microsoft Phi |

---

## ⚙️ Configuration

Config file is stored at `~/.config/yuzz-cli/config.json`

```bash
yuzz config   # View all settings
```

---

## 🛠️ Development

```bash
git clone https://github.com/yuzzoffc/yuzzcli.git
cd yuzzcli
npm install
node src/index.js   # Run directly
```

### Project Structure

```
yuzz-cli/
├── src/
│   ├── index.js          # Main entry point & chat loop
│   ├── config.js         # Configuration management
│   ├── ui.js             # Terminal UI rendering
│   ├── history.js        # Chat history persistence
│   └── providers/
│       ├── gemini.js     # Google Gemini API
│       └── openrouter.js # OpenRouter API
├── package.json
├── README.md
└── LICENSE
```

---

## 🤝 Contributing

Contributions welcome! Ideas:
- Add more providers (Groq, Cohere, Hugging Face)
- Streaming responses
- `/image` command for vision models
- Plugin system
- Config TUI with arrow-key navigation

---

## ⚠️ Usage Restrictions

**STRICTLY PROHIBITED FOR SALE** - Jangan Dijual

This software is provided for **free and non-commercial use only**. 

**Selling, reselling, or commercializing this software or any derivative works is strictly prohibited.**

For commercial use inquiries, please contact the Yuzz Contributors.

---

## 📜 License

MIT © 2026 Yuzz Contributors

---

<div align="center">
Made with ❤️ for terminal lovers
</div>
