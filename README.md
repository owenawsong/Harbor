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

### Prerequisites

Before you begin, ensure you have:

- **Node.js 18.0+** — [Download here](https://nodejs.org/)
  - Check: `node --version`
- **npm 9.0+** — Comes with Node.js
  - Check: `npm --version`
- **Git** — [Download here](https://git-scm.com/)
  - Check: `git --version`
- **Chrome, Brave, Edge, or any Chromium-based browser** (Firefox support coming soon)

**Don't have Node.js?** Follow this quick guide to install:

<details>
<summary><b>📦 Install Node.js by OS</b></summary>

#### Windows
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS (Recommended)** version
3. Run the installer, accept defaults, click **Install**
4. Restart your computer
5. Open PowerShell and verify: `node --version`

#### macOS
```bash
# Option 1: Using Homebrew (easiest)
brew install node

# Option 2: Download from nodejs.org
# Download LTS, run the installer, follow the prompts

# Verify:
node --version
```

#### Linux
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install nodejs npm

# Fedora/CentOS
sudo dnf install nodejs npm

# Arch
sudo pacman -S nodejs npm

# Verify:
node --version
```

</details>

---

### Step 1: Install Harbor

#### **Option A: From GitHub (Recommended for Development)**

**All Platforms:**
```bash
# Clone the repository
git clone https://github.com/owenawsong/Harbor
cd Harbor-Extension

# Install dependencies
npm install

# Build the extension
npm run build
```

**Verification:** You should see a `dist/` folder created with several files inside.

#### **Option B: Download Release (Easiest for Users)**

1. Go to **[Harbor Releases](https://github.com/owenawsong/Harbor/releases)**
2. Download the latest **`harbor-extension-vX.X.X.zip`** (where X.X.X is the version)
3. Extract the ZIP file to your desired location
4. Skip to **Step 2** below

#### **Option C: Chrome Web Store**
*Coming soon — currently in development*

---

### Step 2: Load Harbor into Your Browser

Harbor works on **Chrome, Brave, Edge, and any Chromium-based browser**. Choose your browser below:

#### **Chrome / Chromium**

1. Open `chrome://extensions/` in your address bar
2. Toggle **Developer Mode** ON (top right corner)
3. Click **Load unpacked**
4. Navigate to your `Harbor-Extension/dist/` folder and select it
5. You should see the **⛵ Harbor** extension appear in your extensions list
6. Click the **Harbor icon** in your toolbar to open the side panel

#### **Brave Browser**

1. Open `brave://extensions/` in your address bar
2. Toggle **Developer Mode** ON (top right corner)
3. Click **Load unpacked**
4. Navigate to your `Harbor-Extension/dist/` folder and select it
5. The **⛵ Harbor** extension will appear in your extensions list
6. Click the **Harbor icon** in your toolbar to open the side panel

#### **Microsoft Edge**

1. Open `edge://extensions/` in your address bar
2. Toggle **Developer Mode** ON (left sidebar)
3. Click **Load unpacked**
4. Navigate to your `Harbor-Extension/dist/` folder and select it
5. The **⛵ Harbor** extension will appear in your extensions list
6. Click the **Harbor icon** in your toolbar to open the side panel

#### **Other Chromium-Based Browsers** (Vivaldi, Opera, etc.)

The steps are similar to Chrome:
1. Open the extensions page: `[browser-name]://extensions/`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select the `dist/` folder

---

### Step 3: Verify Installation

✅ **Harbor is installed correctly if:**
- The **⛵ Harbor icon** appears in your browser toolbar
- Clicking it opens a **side panel with "Chat", "Settings", and other tabs**
- No error messages appear in the browser console

❌ **Troubleshooting:**

| Issue | Solution |
|-------|----------|
| **"dist/ folder not found"** | Run `npm run build` from the Harbor-Extension directory |
| **Extension doesn't appear** | Refresh `chrome://extensions/`, try restarting your browser |
| **"Load unpacked" button missing** | Make sure **Developer Mode** is toggled ON |
| **Extension crashes** | Check the browser console (F12 → Console tab) for errors |
| **"Manifest error"** | Ensure you're loading from the `dist/` folder, not `src/` |

---

### Step 4: Configure Your AI Provider

1. **Open Harbor** — Click the ⛵ icon in your toolbar
2. **Click Settings** ⚙️ (top right of the side panel)
3. **Select Your AI Provider:**

| Provider | Setup Time | Best For | Free Option? |
|----------|-----------|----------|------|
| **Claude** | 2 min | Complex reasoning, analysis | ✅ $5 free credit |
| **GPT-4o** | 2 min | Speed, creative tasks | ✅ Free tier available |
| **Gemini** | 2 min | Fast processing, multimodal | ✅ Generous free tier |
| **Ollama** | 5 min | Privacy, zero API costs | ✅ Completely free (local) |
| **OpenRouter** | 2 min | 100+ model options | ⚠️ Pay-per-use |

**How to get API keys:**
- **Claude:** [console.anthropic.com](https://console.anthropic.com) → Click "API" → Create API key
- **GPT-4:** [platform.openai.com](https://platform.openai.com) → API keys → Create new key
- **Gemini:** [aistudio.google.com](https://aistudio.google.com) → Click your profile → API keys
- **Ollama:** [ollama.ai](https://ollama.ai) → Download & run locally (no key needed)
- **OpenRouter:** [openrouter.ai](https://openrouter.ai) → Sign up → API keys

4. **Paste your API key** into the Harbor Settings panel
5. **Click Save** — You're ready to go!

---

### Step 5: Try Your First Task

Open the **Chat** tab and try a prompt like:

```text
"Find the top 3 coffee makers on Amazon with 5+ star reviews under $100"
```

Harbor will:
1. 🌐 Navigate to Amazon
2. 🔍 Search for coffee makers
3. ⭐ Filter by 5+ star reviews and price
4. 📋 Open the top 3 in new tabs
5. 💬 Summarize the results for you

**More examples:**
```text
"Compare flight prices from NYC to London for March 15-20 across 3 sites"
"Fill out this registration form with my LinkedIn profile info"
"Find the best pizza restaurants near me with delivery available"
"Extract all job postings from this page and save them to a CSV"
```

---

### Step 6 (Optional): Development Mode

If you want to modify Harbor and test changes:

```bash
# Start development server with auto-rebuild
npm run dev

# Reload the extension after each change:
# 1. Go to chrome://extensions/
# 2. Click the ♻️ reload icon on Harbor
```

Your changes will be live within seconds!

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
