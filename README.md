<div align="center">
  <img
    src="https://pfst.cf2.poecdn.net/base/image/1bbec1a053e374f75145a00b5044e4852d0e5876ce1d2eb0491232ec4281b900?w=1384&h=768&pmaid=591031806"
    alt="Harbor — Open Source AI Agent Browser Extension"
    width="680"
  />
  <br />
  <div>
    <b>Harbor</b> is an open-source Chrome extension that gives your browser real AI agent powers.<br />
    Automate tasks, navigate websites, and complete workflows — powered by the AI model you choose.
  </div>
  <br />
  <div>
    <a href="https://github.com/owenawsong/Harbor/actions">
      <img src="https://img.shields.io/badge/BUILD-PASSING-44cc11?style=for-the-badge&logo=github" alt="Build Status" />
    </a>
    <a href="https://github.com/owenawsong/Harbor/releases">
      <img src="https://img.shields.io/badge/RELEASE-LATEST-007ec6?style=for-the-badge" alt="Latest Release" />
    </a>
    <a href="https://discord.gg/panb3J2xe2">
      <img src="https://img.shields.io/badge/DISCORD-27K%20ONLINE-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" />
    </a>
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/LICENSE-MIT-007ec6?style=for-the-badge" alt="License" />
    </a>
  </div>
  <br />
  <div>
    <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Vite-5.0-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  </div>
  <br />
  <div>
    <a href="#quick-start"><b>Get Started</b></a> &nbsp;·&nbsp;
    <a href="#what-is-harbor"><b>What is Harbor?</b></a> &nbsp;·&nbsp;
    <a href="#features"><b>Features</b></a> &nbsp;·&nbsp;
    <a href="#how-it-works"><b>How it works</b></a> &nbsp;·&nbsp;
    <a href="https://harbor-extension.pages.dev/docs"><b>Docs</b></a> &nbsp;·&nbsp;
    <a href="https://discord.gg/panb3J2xe2"><b>Discord</b></a>
  </div>
</div>

---

## What is Harbor?

**Harbor is a Chrome extension that runs AI agents inside your browser.**
Instead of only answering questions, Harbor can **control your browser** to complete tasks end-to-end.

Tell Harbor what you want to do and it will:
- understand what's on the page (visual + DOM),
- decide the next action,
- click/type/navigate as needed,
- extract and summarize results,
- and keep going until the workflow is complete.

> [!NOTE]
> Harbor is **open-source** and built with a **privacy-first mindset**. You choose the AI model/provider you want to use.

---

## Features

### Browser control (agent tools)
- Real browser automation (tabs, navigation, downloads, clipboard, and more)
- Visual perception via screenshots of your active tab
- DOM intelligence for structured page understanding and dynamic layouts
- Smart form handling (detects inputs and fills correctly)
- Self-healing retries when elements change

### AI + interaction
- Real-time streaming so you can see progress as the agent works
- Optional context persistence (memory)
- Provider switching in settings
- Command Center (default: **Ctrl+K**)
- Custom profiles for different workflows

### Privacy & security
- No telemetry / no usage analytics (open-source for auditing)
- Encrypted API key storage (stored on your machine)
- Granular permissions: you decide what the agent can access

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
- **Chrome, Brave, Edge, or any Chromium-based browser**

<details>
<summary><b>📦 Install Node.js by OS</b></summary>

#### Windows
1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS** version
3. Run the installer, accept defaults, click **Install**
4. Restart your computer
5. Open PowerShell and verify: `node --version`

#### macOS
```bash
# Option 1: Using Homebrew (easiest)
brew install node

# Option 2: Download from nodejs.org
# Download LTS, run the installer, follow prompts

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

### 1) Install Harbor

#### **Option A: From GitHub (Recommended)**

**All Platforms:**
```bash
git clone https://github.com/owenawsong/Harbor
cd Harbor-Extension
npm install
npm run build
```

**Verification:** You should see a `dist/` folder created.

#### **Option B: From a Release**

1. Download the latest release ZIP from [Releases](https://github.com/owenawsong/Harbor/releases)
2. Extract it to your desired location
3. Skip to **Step 2** below

---

### 2) Load Into Your Browser

Harbor works on **Chrome, Brave, Edge, and any Chromium-based browser**.

#### **Chrome / Chromium**
1. Open `chrome://extensions/` in your address bar
2. Toggle **Developer Mode** ON (top right)
3. Click **Load unpacked**
4. Select your `Harbor-Extension/dist/` folder
5. The **⛵ Harbor** extension appears in your toolbar

#### **Brave Browser**
1. Open `brave://extensions/`
2. Toggle **Developer Mode** ON (top right)
3. Click **Load unpacked**
4. Select your `Harbor-Extension/dist/` folder
5. The **⛵ Harbor** extension appears in your toolbar

#### **Microsoft Edge**
1. Open `edge://extensions/`
2. Toggle **Developer Mode** ON (left sidebar)
3. Click **Load unpacked**
4. Select your `Harbor-Extension/dist/` folder
5. The **⛵ Harbor** extension appears in your toolbar

#### **Other Chromium Browsers** (Vivaldi, Opera, etc.)
1. Open `[browser-name]://extensions/`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select the `dist/` folder

---

### 3) Verify Installation

✅ **Harbor is working if:**
- The **⛵ Harbor icon** appears in your toolbar
- Clicking it opens a side panel with Chat, Settings, and other tabs
- No errors in the browser console (F12 → Console)

❌ **Troubleshooting:**

| Issue | Solution |
|-------|----------|
| `dist/` folder not found | Run `npm run build` from Harbor-Extension directory |
| Extension doesn't appear | Refresh `chrome://extensions/` or restart browser |
| "Load unpacked" button missing | Make sure **Developer Mode** is toggled ON |
| Extension crashes | Check F12 → Console tab for error messages |
| "Manifest error" | Ensure loading from `dist/`, not `src/` |

---

### 4) Connect an AI Provider

1. Click the **⛵ Harbor** icon in your toolbar
2. Click **Settings** ⚙️
3. Select your provider:

| Provider | Setup | Best For | Free? |
|----------|-------|----------|-------|
| **Claude** | 2 min | Complex reasoning | ✅ $5 credit |
| **GPT-4o** | 2 min | Speed & creativity | ✅ Free tier |
| **Gemini** | 2 min | Fast processing | ✅ Free tier |
| **Ollama** | 5 min | Privacy, no costs | ✅ Local, free |
| **OpenRouter** | 2 min | 100+ models | ⚠️ Pay-per-use |

**Get API Keys:**
- **Claude**: [console.anthropic.com](https://console.anthropic.com)
- **GPT-4**: [platform.openai.com](https://platform.openai.com)
- **Gemini**: [aistudio.google.com](https://aistudio.google.com)
- **Ollama**: [ollama.ai](https://ollama.ai) (local, no key needed)
- **OpenRouter**: [openrouter.ai](https://openrouter.ai)

4. Paste your API key and click **Save**

---

### 5) Try It

Open the Harbor side panel and give it a task:

```text
"Find the best coffee makers under $50 with 4+ star reviews."
"Compare flight prices from NYC to London for March and summarize the best option."
"Fill this registration form using the info from my LinkedIn profile."
```

---

## How it works (architecture)

Harbor is a **Chrome Manifest V3** extension with a decoupled architecture:

```text
┌──────────────────────────────────────┐
│         React Side Panel             │  ← UI, Settings, Chat Interface
└──────────────────┬───────────────────┘
                   │ Chrome Runtime Messages
┌──────────────────┴───────────────────┐
│      Service Worker (Background)     │  ← Agent Logic, API Orchestration
└──────────────────┬───────────────────┘
                   │ Content Bridge
┌──────────────────┴───────────────────┐
│           Content Script             │  ← DOM Manipulation, Screenshots
└──────────────────────────────────────┘
```

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

### Hot Reload During Development

1. Run `npm run dev` (rebuilds on file changes)
2. Go to `chrome://extensions/`
3. Click the **reload** icon on Harbor

---

## Contributing

Contributions are welcome: **bugs, features, docs, and ideas**.

1. Check [existing issues](https://github.com/owenawsong/Harbor/issues)
2. Open a [new issue](https://github.com/owenawsong/Harbor/issues/new) or [pull request](https://github.com/owenawsong/Harbor/pulls)
3. Follow [CONTRIBUTING.md](CONTRIBUTING.md)

---

## License

**MIT** — Free for personal and commercial use. See [LICENSE](LICENSE) for details.

---

<div align="center">
  <br />
  Built with React, TypeScript, Vite, and Tailwind CSS.
  <br /><br />
  <a href="https://github.com/owenawsong/Harbor"><b>Star on GitHub</b></a> &nbsp;·&nbsp;
  <a href="#quick-start"><b>Get Started</b></a> &nbsp;·&nbsp;
  <a href="https://discord.gg/panb3J2xe2"><b>Join the Community</b></a>
  <br /><br />
</div>
