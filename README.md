
<div align="center">
  <img src="https://pfst.cf2.poecdn.net/base/image/1bbec1a053e374f75145a00b5044e4852d0e5876ce1d2eb0491232ec4281b900?w=1384&h=768&pmaid=591031806" alt="Harbor — Open Source AI Agent Browser Extension" width="680" />
</div>

<br />

<p align="center">
  <b>The open-source Chrome extension that gives your browser real AI agent powers.</b><br />
  Automate tasks, navigate websites, and complete workflows — powered by any AI model you choose.
</p>

<div align="center">
  <!-- Primary Status Row (Matching your image layout) -->
  <a href="#"><img src="https://img.shields.io/badge/BUILD-PASSING-44cc11?style=for-the-badge" alt="Build" /></a><a href="#"><img src="https://img.shields.io/badge/RELEASE-V2026.3.13--1-007ec6?style=for-the-badge" alt="Release" /></a><a href="https://discord.gg/panb3J2xe2"><img src="https://img.shields.io/badge/DISCORD-27K%20ONLINE-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" /></a><a href="LICENSE"><img src="https://img.shields.io/badge/LICENSE-MIT-007ec6?style=for-the-badge" alt="License" /></a>
  
  <br />
  
  <!-- Tech Stack Row -->
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-5.0-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white" />
</div>

<p align="center">
  <a href="#quick-start"><b>Get Started</b></a> &nbsp;·&nbsp;
  <a href="#features"><b>Features</b></a> &nbsp;·&nbsp;
  <a href="#architecture"><b>Architecture</b></a> &nbsp;·&nbsp;
  <a href="https://harbor-extension.pages.dev/docs"><b>Docs</b></a> &nbsp;·&nbsp;
  <a href="https://discord.gg/panb3J2xe2"><b>Discord</b></a>
</p>

---

## What is Harbor?

Harbor is a **Chrome extension that runs AI agents natively in your browser**. Unlike chatbots that only describe what to do, Harbor actually **controls your browser** to complete tasks on your behalf.

| Icon | Capability | Description |
| :---: | :--- | :--- |
| <img src="https://img.shields.io/badge/-%20-black?style=flat&logo=globe&logoColor=white" /> | **Navigate** | Browses websites intelligently on your behalf |
| <img src="https://img.shields.io/badge/-%20-black?style=flat&logo=mouse-pointer&logoColor=white" /> | **Interact** | Clicks buttons, fills forms, interacts with page elements |
| <img src="https://img.shields.io/badge/-%20-black?style=flat&logo=clipboard&logoColor=white" /> | **Extract** | Summarizes and pulls information from live pages |
| <img src="https://img.shields.io/badge/-%20-black?style=flat&logo=layers&logoColor=white" /> | **Manage** | Controls tabs, bookmarks, history, and downloads |
| <img src="https://img.shields.io/badge/-%20-black?style=flat&logo=zap&logoColor=white" /> | **Automate** | Executes complex multi-step workflows end-to-end |
| <img src="https://img.shields.io/badge/-%20-black?style=flat&logo=bot&logoColor=white" /> | **Agnostic** | Works with Claude, GPT-4o, Gemini, and Ollama |

> [!NOTE]  
> Harbor is a privacy-first, open-source alternative to Perplexity Comet and ChatGPT Atlas — providing full control over your data.

---

## Features

### <img src="https://img.shields.io/badge/-%20-3178C6?style=flat&logo=monitor&logoColor=white" /> Browser Control
- **57 Browser Tools** — Full control over tabs, bookmarks, and clipboard
- **Visual Perception** — AI analyzes real-time screenshots of your active tab
- **DOM Intelligence** — Understands page structure and adapts to layouts
- **Smart Forms** — Automatically detects input types and maps data accurately
- **Self-Healing** — Automatically retries when web elements change

### <img src="https://img.shields.io/badge/-%20-3178C6?style=flat&logo=cpu&logoColor=white" /> AI & Interface
- **Real-time Streaming** — Watch the agent's thought process as it happens
- **Context Persistence** — Optional conversation memory that stays with you
- **Provider Switching** — Swap between AI backends instantly via settings
- **Command Center** — Use `Ctrl+K` to trigger actions and searches
- **Custom Profiles** — Save specific model configurations for workflows

### <img src="https://img.shields.io/badge/-%20-3178C6?style=flat&logo=shield-check&logoColor=white" /> Privacy & Security
- **Local-First** — Conversations and data never leave your local environment
- **Zero Tracking** — No telemetry, no analytics, and no data collection
- **Secure Vault** — API keys are encrypted and stored only on your machine
- **Audit-Ready** — Fully open-source codebase for complete transparency
- **Granular Permissions** — You control exactly what the AI can see

---

## Quick Start

### 1. Install

**From GitHub**

```bash
git clone https://github.com/owenawsong/Harbor
cd Harbor-Extension
npm install
npm run build
```

Then load into Chrome:
1. Go to `chrome://extensions/`
2. Enable **Developer Mode**
3. Click **Load unpacked** → select the `dist/` folder

---

### 2. Connect an AI Provider

Click the **Harbor** icon → **Settings** → select your provider:

| Provider | Best For | API Source |
| :--- | :--- | :--- |
| **Claude** | Complex reasoning | [console.anthropic.com] |
| **GPT-4o** | Speed & creativity | [platform.openai.com] |
| **Gemini** | Multimodal tasks | [aistudio.google.com] |
| **Ollama** | Local privacy | [ollama.com] |
| **OpenRouter** | Model variety | [openrouter.ai] |

---

## Architecture

Harbor is built as a **Chrome Manifest V3 extension** using a decoupled architecture.

```text
┌──────────────────────────────────────┐
│         React Side Panel             │  ←  UI, Settings, Chat Interface
└──────────────────┬───────────────────┘
                   │  Chrome Runtime Messages
┌──────────────────┴───────────────────┐
│      Service Worker (Background)     │  ←  Agent Logic, API Orchestration
└──────────────────┬───────────────────┘
                   │  Content Bridge
┌──────────────────┴───────────────────┐
│           Content Script             │  ←  DOM Manipulation, Screenshots
└──────────────────────────────────────┘
```

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
