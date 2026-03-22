<div align="center">
  <img src="https://pfst.cf2.poecdn.net/base/image/1bbec1a053e374f75145a00b5044e4852d0e5876ce1d2eb0491232ec4281b900?w=1384&h=768&pmaid=591031806" alt="Harbor — Open Source AI Agent Browser Extension" width="680" />
</div>

<br />

<p align="center">
  <b>Harbor</b> is an open-source Chrome extension that gives your browser real AI agent powers.
  <br />
  Automate tasks, navigate websites, and complete workflows — powered by the AI model you choose.
</p>

<div align="center">

  <!-- Status Badges -->
  <a href="https://github.com/owenawsong/Harbor/actions">
    <img src="https://img.shields.io/badge/BUILD-PASSING-44cc11?style=for-the-badge&logo=github" alt="Build Status" />
  </a>
  &nbsp;
  <a href="https://github.com/owenawsong/Harbor/releases">
    <img src="https://img.shields.io/badge/RELEASE-V2026.3.13--1-007ec6?style=for-the-badge" alt="Release Version" />
  </a>
  &nbsp;
  <a href="https://discord.gg/panb3J2xe2">
    <img src="https://img.shields.io/badge/DISCORD-27K%20ONLINE-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" />
  </a>
  &nbsp;
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/LICENSE-MIT-007ec6?style=for-the-badge" alt="License" />
  </a>

  <br /><br />

  <!-- Tech Stack Badges -->
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-5.0-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white" />
</div>

<br />

<div align="center">
  <a href="#quick-start"><b>Get Started</b></a> &nbsp;·&nbsp;
  <a href="#what-is-harbor"><b>What is Harbor?</b></a> &nbsp;·&nbsp;
  <a href="#features"><b>Features</b></a> &nbsp;·&nbsp;
  <a href="#how-it-works"><b>How it Works</b></a> &nbsp;·&nbsp;
  <a href="#providers"><b>AI Providers</b></a> &nbsp;·&nbsp;
  <a href="https://harbor-extension.pages.dev/docs"><b>Docs</b></a> &nbsp;·&nbsp;
  <a href="https://discord.gg/panb3J2xe2"><b>Discord</b></a>
</div>

---

## What is Harbor?

**Harbor is a Chrome extension that runs AI agents directly in your browser.**  
Unlike a typical chatbot (which only *talks* about what you should do), Harbor can **control your browser** to complete tasks end-to-end.

Give Harbor a natural-language instruction and it will:
- understand what’s on the page,
- decide what actions to take,
- click / type / navigate as needed,
- extract and summarize results,
- and keep going until the workflow is complete.

> [!NOTE]
> Harbor is **privacy-first** and **open-source**. You keep control over your data and can use the AI model/provider you prefer.

---

## Key capabilities

Harbor can do more than “answer questions.” It can *operate*.

| Capability | What it means in practice |
|---|---|
| 🌐 **Navigate** | Browses websites intelligently based on your goal |
| 🖱️ **Interact** | Clicks buttons, fills forms, and interacts with page elements |
| 📋 **Extract** | Summarizes and pulls information from live pages |
| 🗂️ **Manage** | Handles higher-level browser tasks (tabs, downloads, etc.) |
| ⚡ **Automate** | Executes multi-step workflows from start to finish |
| 🤖 **Model-agnostic** | Works with Claude, GPT-4o, Gemini, Ollama, OpenRouter, and more |

---

## Features

### Browser Control (Agent Tools)
- **57 Browser Tools** for controlling common browser/UI actions (tabs, bookmarks, downloads, clipboard, etc.)
- **Visual Perception** via real-time screenshots of your active tab
- **DOM Intelligence** to understand page structure and adapt to dynamic layouts
- **Smart Forms** to detect inputs and map your data accurately
- **Self-Healing** retries and recovers when web elements change

### AI + Interaction
- **Real-time streaming** so you can see progress as the agent acts
- **Context persistence** (optional conversation memory)
- **Provider switching** to change AI backends from the settings panel
- **Command Center**: press **Ctrl+K** to trigger actions and searches instantly
- **Custom profiles** to save model/config presets per workflow

### Privacy & Security
- **Local-first design**: your conversations and data don’t need to leave your environment
- **Zero tracking / no telemetry**: no usage analytics, no data collection
- **Secure vault**: API keys are encrypted and stored only on your machine
- **Audit-ready**: fully open-source for transparency
- **Granular permissions**: you decide what the agent can access and do

---

## Quick Start

### 1) Install

#### Option A — Build from GitHub (recommended)
```bash
git clone https://github.com/owenawsong/Harbor
cd Harbor-Extension
npm install
npm run build
```

Load into Chrome:
1. Open `chrome://extensions/`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select the extension’s `dist/` folder

#### Option B — Install a Release
1. Download the latest release ZIP from the repo
2. Extract it
3. Load unpacked (steps above)

---

### 2) Connect an AI Provider

Click the **Harbor** icon → **Settings** → choose your provider.

| Provider | Best for | Provider console |
|---|---|---|
| **Claude** | Complex reasoning & analysis | https://console.anthropic.com |
| **GPT-4o** | Speed & creative tasks | https://platform.openai.com |
| **Gemini** | Multimodal + flexible options | https://aistudio.google.com |
| **Ollama** | Local/private execution | https://ollama.com |
| **OpenRouter** | Many models + easy switching | https://openrouter.ai |

---

### 3) Try it

Open the Harbor side panel and give it a task, for example:

```text
"Find the top 3 coffee makers on Amazon with 5-star reviews under $50"
"Compare flight prices NYC to London in March across Google Flights"
"Fill this registration form using my info from my LinkedIn profile"
```

---

## How it works (architecture)

Harbor is built as a **Chrome Manifest V3 extension** using a decoupled, multi-part design:

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

## Providers & workflows

A good way to think about Harbor is:

1. **You specify the goal** (what “done” looks like)
2. **Harbor observes the page** (visual + DOM understanding)
3. **Harbor executes actions** using its browser tools
4. **Harbor extracts results** and summarizes outcomes

This makes it especially useful for:
- form-heavy tasks
- research and comparison workflows
- data extraction from multiple pages
- repetitive “click/verify/copy” jobs

---

## Contributing

Contributions are welcome—**bugs, features, docs, and ideas**.

1. Check [existing issues](https://github.com/owenawsong/Harbor/issues)
2. Open a [new issue](https://github.com/owenawsong/Harbor/issues/new) or [pull request](https://github.com/owenawsong/Harbor/pulls)
3. Follow [CONTRIBUTING.md](CONTRIBUTING.md)

---

## License

**MIT** — Free for personal and commercial use. See [LICENSE](LICENSE) for details.

---

<div align="center">
  <br />
  Built with React 18, TypeScript 5.6, Vite, and Tailwind CSS.
  <br /><br />
  <a href="https://github.com/owenawsong/Harbor"><b>Star on GitHub</b></a> &nbsp;·&nbsp;
  <a href="#quick-start"><b>Get Started</b></a> &nbsp;·&nbsp;
  <a href="https://discord.gg/panb3J2xe2"><b>Join the Community</b></a>
  <br /><br />
</div>
