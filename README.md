<div align="center">

# ⛵ Harbor

### **Real AI Agent Powers for Your Browser**

> The intelligent browser extension that automates tasks, not just chatting. With any AI model you choose.

<br />

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/GitHub-Open%20Source-black?logo=github)](https://github.com/owenawsong/Harbor)
[![Discord](https://img.shields.io/badge/Discord-Join%20us-5865F2?logo=discord&logoColor=white)](https://discord.gg/panb3J2xe2)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)]()
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)]()

<br />

**[🚀 Get Started](#quick-start)** • **[📖 Features](#features)** • **[🏗️ How It Works](#architecture)** • **[🤝 Contribute](#contributing)** • **[⭐ Support](#license)**

</div>

---

## What is Harbor?

Harbor is a **Chrome extension that runs AI agents natively in your browser**. Unlike traditional chatbots, Harbor doesn't just tell you what to do—it actually **controls your browser** to complete tasks.

Give Harbor a natural language instruction, and it:
- ✅ **Navigates websites** with intelligence
- ✅ **Clicks buttons & fills forms** automatically
- ✅ **Extracts & summarizes** information from pages
- ✅ **Manages tabs, bookmarks, downloads** seamlessly
- ✅ **Executes complex workflows** end-to-end
- ✅ **Works with ANY AI model** you choose

### Perfect For:
- 🔍 **Research & Data Gathering** — Search multiple sites, compare results
- 📋 **Form Filling & Registration** — Auto-complete with your profile data
- 💰 **Price Comparison** — Find the best deals across retailers
- 📰 **Content Curation** — Summarize articles, extract key info
- 🛒 **Shopping Automation** — Browse, compare, and add to cart
- 📊 **Business Tasks** — Automate data entry, report generation
- 🎯 **Custom Workflows** — Build your own browser automations

---

## Why Harbor? 🎯

### vs. ChatGPT / Claude.ai / Gemini
- ✅ **Actually controls your browser** — Not just text responses
- ✅ **Always available** — No tab switching or copy/paste
- ✅ **Real-time web access** — Sees live prices, updates, current content
- ❌ Chatbots can only *describe* what to do; Harbor actually *does it*

### vs. Perplexity Comet / ChatGPT Atlas
- ✅ **Open source** — Full transparency, no hidden tracking
- ✅ **Use YOUR AI choice** — Claude, GPT-4o, Gemini, Ollama, or any model
- ✅ **Privacy first** — Your browser history stays on YOUR machine
- ✅ **No vendor lock-in** — Fork it, modify it, control it
- ❌ Comet/Atlas may collect browsing data for their own use

### vs. Traditional Extensions
- ✅ **Genuinely intelligent** — Understands context & intent
- ✅ **No site-specific rules** — Works on ANY website
- ✅ **Adaptive automation** — Handles page changes dynamically
- ❌ Other extensions need hardcoded rules for every site

---

## Quick Start

### Step 1: Install Harbor

**Option A: From GitHub (Recommended)**
```bash
git clone https://github.com/owenawsong/Harbor
cd Harbor-Extension
npm install
npm run build
```
Then:
1. Go to `chrome://extensions/`
2. Enable **"Developer Mode"** (top right)
3. Click **"Load unpacked"**
4. Select the `dist/` folder

**Option B: Download Release**
- [Download latest release](https://github.com/owenawsong/Harbor/releases)
- Extract the ZIP
- Follow "Load unpacked" steps above

**Option C: Chrome Web Store**
*Coming soon — currently in development*

### Step 2: Configure Your AI Provider

1. Click the **⛵ Harbor** icon in your Chrome toolbar
2. Click **Settings** ⚙️
3. Choose your AI provider:
   - **Claude** (Anthropic) — Best for complex reasoning
   - **GPT-4o** (OpenAI) — Fast and creative
   - **Gemini** (Google) — Free tier available
   - **Ollama** (Local) — Privacy, zero API costs
   - **OpenRouter** — 100+ models, easy switching

4. Paste your API key → Click **Save**
5. **Done!** Start using Harbor

### Step 3: Give It a Task

Chat with Harbor in the side panel:
```
"Find the top 3 products on Amazon with 5-star reviews for coffee makers"
↓ Harbor searches Amazon, filters by reviews, opens the top 3 in tabs

"Compare prices for flights NYC → London in March across 3 sites"
↓ Harbor finds flights, compares prices, presents results

"Fill this form with my contact info from my LinkedIn profile"
↓ Harbor reads your LinkedIn, auto-fills the form perfectly
```

---

## Features 🌟

### Core AI Capabilities
- **57 Browser Tools** — Everything from tabs to bookmarks to downloads
- **Real-time Screenshots** — AI can see exactly what's on the page
- **Intelligent Navigation** — Understands page structure, finds elements adaptively
- **Form Intelligence** — Auto-detects input types, fills correctly
- **Tab Management** — Open, close, group, search tabs with AI understanding
- **File Downloads** — Automated file handling and organization
- **Clipboard Integration** — Copy/paste data between page and browser

### Intelligence & Control
- **Streaming Responses** — Watch the AI think in real-time
- **Optional Memory** — AI remembers conversation context
- **Multiple AI Models** — Switch between Claude, GPT, Gemini instantly
- **Command Palette** — Quick-access with `Ctrl+K`
- **Settings Profiles** — Save favorite model configurations
- **Error Recovery** — Automatic retries when things go wrong

### Data & Privacy
- **100% Local** — All conversations stay on your device
- **No Tracking** — Open source, audit-able code
- **Secure Storage** — API keys encrypted, never sent to servers
- **Export/Import** — Backup and restore all your data
- **Selective Sharing** — You control what data AI sees

---

## Supported AI Providers

| Provider | Setup Time | Best For | Cost |
|----------|-----------|----------|------|
| **Claude** | 2 min | Complex reasoning, analysis | $3-15/mo typical |
| **GPT-4o** | 2 min | Speed, creative tasks | $5-20/mo typical |
| **Gemini** | 2 min | Fast processing, multimodal | Free tier available |
| **Ollama** | 5 min | Privacy, no API costs | Free (runs locally) |
| **OpenRouter** | 2 min | 100+ model options, fallbacks | Pay-per-use |

**How to get API keys:**
- [Claude](https://console.anthropic.com) — Free $5 credit
- [GPT-4](https://platform.openai.com) — Set your own limits
- [Gemini](https://aistudio.google.com) — Generous free tier
- [Ollama](https://ollama.ai) — Free, runs on your computer

---

## Architecture 🏗️

Harbor uses a **Chrome Manifest V3 extension** architecture with React & TypeScript:

```
┌─────────────────────────────────┐
│    React Side Panel UI          │  ← Chat, Settings, Memory
│    (Chat, Settings, History)    │
└─────────────┬───────────────────┘
              ↕ (Chrome Messages)
┌─────────────────────────────────┐
│   Service Worker (bg script)    │  ← Agent Loop, AI API Calls
│   (Orchestration & Agent Loop)  │
└─────────────┬───────────────────┘
              ↕ (DOM Commands)
┌─────────────────────────────────┐
│   Content Script                │  ← Page Interaction
│   (Click, Type, Screenshot)     │
└─────────────────────────────────┘
```

**How It Works:**
1. You type a message in the side panel
2. Service worker sends it to your AI provider with available tools
3. AI responds with specific tool calls (e.g., "click button #submit")
4. Content script executes those actions on the page
5. Screenshots & results sent back to AI for next step
6. Process repeats until task is complete
7. Final response streamed back to you

---

## Development

### Local Development Setup

```bash
# Clone and install
git clone https://github.com/owenawsong/Harbor
cd Harbor-Extension
npm install

# Development with auto-rebuild
npm run dev

# Production build
npm run build

# Type checking
npm run type-check
```

### Project Structure

```
src/
├── sidepanel/           # React UI
│   ├── components/      # Chat, Settings, Dashboard, etc.
│   └── App.tsx          # Main React app
├── background/          # Service worker
│   ├── agent/           # Core agent logic
│   ├── tools/           # 57 browser tools
│   └── index.ts         # Main background script
├── content/             # Content script
│   ├── index.ts         # Page interaction & clicks
│   └── overlay.ts       # UI overlays
├── shared/              # Shared utilities
│   ├── types.ts         # Type definitions
│   ├── constants.ts     # Configuration
│   └── utils/           # Helper functions
└── styles/              # Global CSS & Tailwind
```

### Hot Reload During Development

After editing files:
1. `npm run dev` rebuilds automatically
2. Go to `chrome://extensions/`
3. Click the **reload** icon on the Harbor extension card

---

## Privacy & Security 🔒

- **No Telemetry** — We don't track your usage
- **No Data Collection** — Your conversations stay local
- **No Server Calls** — Only your chosen AI provider gets data
- **Open Source** — Audit the code yourself
- **Content Security Policy** — Enforced for safety
- **No Sensitive Access** — Can't access passwords, cookies, or payment info

### Permissions Explained

| Permission | Why |
|------------|-----|
| `activeTab`, `tabs` | Control and switch tabs |
| `scripting` | Run commands on pages |
| `sidePanel` | Display the UI |
| `storage` | Save settings locally |
| `history`, `bookmarks` | Read your data (optional) |
| `downloads` | Download files |
| `clipboardWrite`, `clipboardRead` | Copy/paste data |
| `notifications` | Alert you when done |
| `contextMenus` | Right-click options |

**NOT requested:** Cookies, passwords, payment info, network monitoring

---

## Known Limitations

- **JavaScript-Heavy Sites** — Heavily obfuscated sites may be harder to automate
- **Rate Limiting** — Subject to your AI provider's limits
- **Page Redesigns** — If a site completely redesigns, selectors may need updating
- **System Commands** — Can't run terminal/system commands
- **Local Files** — Can't access local file system (only downloads folder)

---

## Contributing

Found a bug? Want a feature? We'd love your help!

1. **[Check existing issues](https://github.com/owenawsong/Harbor/issues)**
2. **[Open a new issue](https://github.com/owenawsong/Harbor/issues/new)** or **[PR](https://github.com/owenawsong/Harbor/pulls)**
3. Follow the **[CONTRIBUTING.md](CONTRIBUTING.md)** guidelines
4. Make sure tests pass: `npm run type-check && npm run build`

See **[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)** for community standards.

---

## Roadmap 🚀

- [ ] **Chrome Web Store** — Official submission & listing
- [ ] **Firefox Support** — Extend to Firefox users
- [ ] **MCP Integration** — Use Harbor as Model Context Protocol server
- [ ] **Scheduled Tasks** — Run agents on a daily schedule
- [ ] **Advanced Memory** — AI learns from your browsing patterns
- [ ] **Custom Tools** — Build your own automation tools
- [ ] **Cloud Sync** — Optional cross-device sync (privacy-preserving)
- [ ] **Visual Builder** — No-code workflow creation

**[Suggest a feature →](https://github.com/owenawsong/Harbor/issues/new?template=feature_request.md)**

---

## Support & Docs

- 📖 **Full Documentation** — [harbor-extension.pages.dev/docs](https://harbor-extension.pages.dev/docs)
- 💬 **Discord Community** — [Join Discord](https://discord.gg/panb3J2xe2)
- 🐛 **Report a Bug** — [Create issue](https://github.com/owenawsong/Harbor/issues)
- 💡 **Feature Request** — [Suggest idea](https://github.com/owenawsong/Harbor/issues/new)

---

## License

**MIT License** — Free for personal and commercial use. See **[LICENSE](LICENSE)** for details.

Harbor is open source. You're free to use, modify, and distribute it in your own projects.

---

## Credits & Acknowledgments

- Built with **React 18** & **TypeScript 5.6**
- Powered by **Vite** for blazing-fast builds
- Styled with **Tailwind CSS 3**
- Icons by **[Lucide React](https://lucide.dev/)**
- Math rendering by **[KaTeX](https://katex.org/)**
- Markdown by **[React Markdown](https://github.com/remarkjs/react-markdown)**

---

<div align="center">

**Made with ❤️ by developers, for developers**

Harbor brings AI agents into your browser. Automate anything, control everything, keep your privacy.

**[⭐ Star on GitHub](https://github.com/owenawsong/Harbor)** • **[🚀 Get Started](#quick-start)** • **[💬 Join Community](#support--docs)**

</div>
