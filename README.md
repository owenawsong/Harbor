# Harbor — AI Browser Agent

> **Real AI agent powers for your browser. No new browser, no AI wrapper—just pure automation.**

A Chrome extension that gives you a real AI agent inside your browser. Not a chatbot. Not another browser. An intelligent agent that **reads pages, clicks buttons, fills forms, finds information, and automates tasks** across any website.

---

## 🚀 What It Does

Harbor uses AI to understand what you want, then **actually controls your browser**. Give it a task in natural language, and it:

- ✅ Navigates to websites
- ✅ Clicks buttons and fills forms
- ✅ Extracts and summarizes information
- ✅ Manages tabs, windows, bookmarks
- ✅ Downloads files
- ✅ Executes complex workflows
- ✅ **Works with ANY AI model** you choose

### Real Examples

```
"Search GitHub for trending AI repos and open the top 3 in new tabs"
→ Harbor opens GitHub, searches, and opens 3 tabs automatically

"Find the cheapest flight from NYC to London in March and compare prices"
→ Harbor searches multiple sites and compares prices in real-time

"Fill out this form with my contact info and address from my profile"
→ Harbor reads your profile and auto-fills the form

"Summarize all content on this page and save it as a PDF bookmark"
→ Harbor extracts, summarizes, and saves—all in one step

"Monitor this stock price and alert me when it drops 5%"
→ Harbor runs scheduled checks and notifies you
```

---

## 🎯 Why Harbor?

### vs. **Perplexity Comet & GPT Atlas**
- ✅ **Open-source** — Full control, no vendor lock-in
- ✅ **Your AI choice** — Claude, GPT-4o, Gemini, Ollama, or any model
- ✅ **Privacy-first** — API keys stay in your browser, nothing sent to servers
- ✅ **Works everywhere** — Not limited to Perplexity or specific models
- ❌ Comet may collect browsing data; Atlas is Mac-only with usage limits

### vs. **Standard Chatbots** (ChatGPT, Claude.ai, Gemini)
- ✅ **Actually controls your browser** — Not just text responses
- ✅ **Always available** — No tab switching or copy/paste
- ✅ **Real-time web access** — Sees live prices, updates, content
- ✅ **Task automation** — Handles complex multi-step workflows
- ❌ Chatbots can only tell you what to do; Harbor actually does it

### vs. **Regular Browser Extensions**
- ✅ **Genuinely intelligent** — Understands context and intent
- ✅ **No repetitive configs** — One setup, works everywhere
- ✅ **Adaptive** — Handles page changes, finds elements dynamically
- ❌ Other extensions need specific rules for every site

---

## ⚡ Quick Start

### 1. Install

**Option A: Latest Release**
- Download from [GitHub Releases](https://github.com/owenawsong/Harbor-Extension/releases)
- Extract the ZIP
- Go to `chrome://extensions/` → Enable "Developer Mode" → Click "Load unpacked" → Select folder

**Option B: Build from Source**
```bash
git clone https://github.com/owenawsong/Harbor-Extension
cd Harbor-Extension
npm install
npm run build
```
Then follow Option A with the `dist/` folder.

**Option C: Chrome Web Store**
*Coming soon* — Currently in development.

### 2. Set Up

1. Click the **H** icon in your Chrome toolbar
2. Click **Settings** ⚙️
3. Choose your AI provider and enter your API key
4. Done! Start chatting.

### 3. Use It

```
Chat with your agent in the side panel. Examples:

"What are the top 3 stories on Hacker News?"
"Find me a 3-star hotel under $150 in NYC for next weekend"
"Screenshot all these 10 tabs and create a summary document"
```

---

## 🧠 Supported AI Providers

| Provider | Setup Time | Best For | Cost |
|----------|-----------|----------|------|
| **Claude** (Anthropic) | 2 min | Complex reasoning, long context | $3-15/mo typical |
| **GPT-4o** (OpenAI) | 2 min | Fast, creative tasks | $5-20/mo typical |
| **Gemini** (Google) | 2 min | Speed, multimodal | Free tier available |
| **Ollama** (Local) | 5 min | Privacy, no API costs | Free (runs locally) |
| **OpenRouter** | 2 min | 100+ models, fallbacks | Pay-per-use |
| **OpenAI-compatible** | 5 min | LM Studio, Jan, vLLM | Varies |

**How to get API keys:**
- **Claude**: [console.anthropic.com](https://console.anthropic.com)
- **GPT-4**: [platform.openai.com](https://platform.openai.com)
- **Gemini**: [aistudio.google.com](https://aistudio.google.com)
- **Ollama**: [ollama.ai](https://ollama.ai) (free, runs on your computer)

---

## 📋 Features

### Core Capabilities
- **57 browser tools** — Everything from tabs to bookmarks to downloads
- **Real-time screenshots** — AI can see what's on the page
- **Form filling** — Auto-detect and complete input fields
- **Tab management** — Open, close, group, switch between tabs
- **History & bookmarks** — Access and organize your browsing
- **Downloads** — Automated file downloads and management
- **Clipboard** — Copy/paste data to and from pages
- **Notifications** — Send alerts when tasks complete

### Intelligence Features
- **Streaming responses** — See the AI thinking in real-time
- **Memory** — Optional: AI remembers context between messages
- **Tone/style settings** — Professional, casual, concise, detailed, creative
- **Custom presets** — Save favorite model configs for quick switching
- **Command palette** — `Ctrl+K` — Quick access to common tasks

### Data & Privacy
- **Local-only storage** — All conversations stay on your device
- **Export/import** — Backup and restore all your data
- **API key encryption** — Keys are never sent to servers
- **No tracking** — Built for privacy, open-source code

---

## 🏗️ Architecture

Harbor is a **Chrome Manifest V3 extension** built with React and TypeScript:

```
┌─────────────────────────────────────┐
│   Side Panel UI (React)             │  ← Chat interface, settings, memory
│   └─ Chat, Settings, History        │
└──────────────────────────────────────┘
         ↕ (Messages)
┌──────────────────────────────────────┐
│   Service Worker (background.js)    │  ← Agent loop, AI calls, orchestration
│   └─ Agent loop, tool execution     │
└──────────────────────────────────────┘
         ↕ (DOM control)
┌──────────────────────────────────────┐
│   Content Script (content.js)       │  ← DOM interaction, page control
│   └─ Click, type, screenshot        │
└──────────────────────────────────────┘
```

**How It Works:**
1. You type a message in the side panel
2. Service worker sends it to your chosen AI provider with available tools
3. AI responds with tool calls (e.g., "click button #submit")
4. Content script executes tool calls on the page
5. Screenshots/results are sent back to AI for next step
6. Process repeats until task is complete
7. Final response is streamed back to you

---

## 🛠️ Development

### Setup
```bash
npm install
npm run dev        # Watch mode (auto-rebuild on changes)
npm run build      # Production build
npm run type-check # TypeScript checking
```

### Project Structure
```
src/
├── sidepanel/         # React UI components
│   ├── components/    # Chat, Settings, Onboarding, etc.
│   └── App.tsx
├── background/        # Service worker
│   ├── agent/         # Core agent logic
│   ├── tools/         # Browser tool implementations
│   └── index.ts
├── content/           # Content script (page interaction)
└── shared/            # Types, constants, utilities
```

### Hot Reload
After editing source files:
1. `npm run dev` rebuilds automatically
2. Go to `chrome://extensions/`
3. Click the **reload** icon on the Harbor card

---

## 🚨 Privacy & Security

- **No telemetry** — We don't track your usage
- **No data collection** — Conversations stay local
- **Open source** — Audit the code yourself
- **API keys secure** — Never sent to our servers
- **Content script sandboxing** — Page scripts can't access your data

---

## 📦 Permissions Explained

Harbor requests these Chrome permissions:

| Permission | Why |
|------------|-----|
| `activeTab`, `tabs` | Control browser tabs |
| `scripting` | Run commands on pages |
| `sidePanel` | Display the UI |
| `storage` | Save settings & history |
| `history`, `bookmarks` | Access your browser data |
| `downloads` | Download files |
| `clipboardWrite`, `clipboardRead` | Copy/paste data |
| `notifications` | Alert you when done |
| `contextMenus` | Right-click options |

**No permissions for:** cookies, passwords, network monitoring, or sensitive APIs.

---

## 🐛 Known Limitations

- **JavaScript-heavy sites** — Some sites using heavy obfuscation may be harder to automate
- **Rate limiting** — Your AI provider's rate limits apply
- **Page changes** — If a site heavily redesigns, selectors may need adjustment
- **No terminal access** — Can't run system commands
- **No file system access** — Can't access local files (except downloads folder)

---

## 🤝 Contributing

Found a bug or have an idea?

1. Check [existing issues](https://github.com/owenawsong/Harbor-Extension/issues)
2. Open a [new issue](https://github.com/owenawsong/Harbor-Extension/issues/new) or [pull request](https://github.com/owenawsong/Harbor-Extension/pulls)
3. Follow the code style (ESLint will help)

---

## 📄 License

**MIT** — Free and open-source. See [LICENSE](LICENSE) for details.

You're free to use, modify, and distribute Harbor in your own projects.

---

## 🌟 What's Next?

**Roadmap:**
- [ ] WebStore submission
- [ ] Firefox support
- [ ] MCP (Model Context Protocol) servers
- [ ] Scheduled/recurring tasks
- [ ] Advanced memory & learning
- [ ] Custom tool creation
- [ ] Cloud sync (optional, privacy-preserving)

**Have an idea?** [Open a feature request](https://github.com/owenawsong/Harbor-Extension/issues/new?labels=enhancement)

---

## 📞 Support

- **Documentation** — Read the [full guide](https://harbor.app/docs)
- **GitHub Issues** — Report bugs or ask questions
- **Discussions** — Chat with the community

---

**Made with ❤️ for browser automation**

Harbor is built by developers, for developers. It's open-source, privacy-first, and designed to work with *your* favorite AI model.

[🚀 Get Started Now](https://github.com/owenawsong/Harbor-Extension) • [📖 Read Docs](https://harbor.app/docs) • [🐛 Report Bug](https://github.com/owenawsong/Harbor-Extension/issues) • [⭐ Star on GitHub](https://github.com/owenawsong/Harbor-Extension)
