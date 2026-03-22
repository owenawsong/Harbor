
<div align="center">
  <img src="https://pfst.cf2.poecdn.net/base/image/1bbec1a053e374f75145a00b5044e4852d0e5876ce1d2eb0491232ec4281b900?w=1384&h=768&pmaid=591031806" alt="Harbor — Open Source AI Agent Browser Extension" width="680" />
</div>

<br />

<p align="center">
  The open-source Chrome extension that gives your browser real AI agent powers.<br />
  Automate tasks, navigate websites, and complete workflows — powered by any AI model you choose.
</p>

<div align="center">
  <!-- Status Badges -->
  <table style="border-collapse: collapse; border: none;">
    <tr style="border: none;">
      <td style="border: none; padding: 0 2px;">
        <a href="https://github.com/owenawsong/Harbor/actions">
          <img src="https://img.shields.io/badge/BUILD-PASSING-44cc11?style=for-the-badge&logo=github" alt="Build Status" />
        </a>
      </td>
      <td style="border: none; padding: 0 2px;">
        <a href="https://github.com/owenawsong/Harbor/releases">
          <img src="https://img.shields.io/badge/RELEASE-V2026.3.13--1-007ec6?style=for-the-badge" alt="Release Version" />
        </a>
      </td>
      <td style="border: none; padding: 0 2px;">
        <a href="https://discord.gg/panb3J2xe2">
          <img src="https://img.shields.io/badge/DISCORD-27K%20ONLINE-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" />
        </a>
      </td>
      <td style="border: none; padding: 0 2px;">
        <a href="LICENSE">
          <img src="https://img.shields.io/badge/LICENSE-MIT-007ec6?style=for-the-badge" alt="License" />
        </a>
      </td>
    </tr>
  </table>
  <br />
  <!-- Tech Stack Badges -->
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

Give it a natural language instruction and Harbor handles the rest:

| Capability | Description |
|---|---|
| 🌐 **Navigate** | Browses websites intelligently on your behalf |
| 🖱️ **Interact** | Clicks buttons, fills forms, interacts with any page element |
| 📋 **Extract** | Summarizes and pulls information from live pages |
| 🗂️ **Manage** | Controls tabs, bookmarks, history, and downloads |
| ⚡ **Automate** | Executes complex multi-step workflows end-to-end |
| 🤖 **Model-agnostic** | Works with Claude, GPT-4o, Gemini, Ollama, and more |

> [!NOTE]  
> Harbor is a privacy-first, open-source alternative to Perplexity Comet, ChatGPT Atlas, and Dia — with full control over your data and your AI model.

---

## Features

### Browser Control
- **57 Browser Tools** — Full control over tabs, bookmarks, downloads, and clipboard
- **Visual Perception** — The AI analyzes real-time screenshots of your active tab
- **DOM Intelligence** — Understands page structure and adapts to dynamic layouts
- **Smart Forms** — Automatically detects input types and maps data accurately
- **Self-Healing** — Automatically retries and recovers when web elements change

### AI & Interface
- **Real-time Streaming** — Watch the agent's thought process and actions as they happen
- **Context Persistence** — Optional conversation memory that stays with you
- **Provider Switching** — Swap between AI backends instantly via the settings panel
- **Command Center** — Use `Ctrl+K` to trigger actions and searches instantly
- **Custom Profiles** — Save specific model configurations for different workflows

### Privacy & Security
- **Local-First** — Your conversations and data never leave your local environment
- **Zero Tracking** — No telemetry, no usage analytics, and no data collection
- **Secure Vault** — API keys are encrypted and stored only on your machine
- **Audit-Ready** — Fully open-source codebase for complete transparency
- **Granular Permissions** — You decide exactly what the AI is allowed to see and do

---

## Quick Start

### 1. Install

**From GitHub** *(Recommended)*

```bash
git clone https://github.com/owenawsong/Harbor
cd Harbor-Extension
npm install
npm run build
```

Then load into Chrome:
1. Go to `chrome://extensions/`
2. Enable **Developer Mode** (top-right toggle)
3. Click **Load unpacked** → select the `dist/` folder

**From a Release**

[Download the latest release →]  
Extract the ZIP, then follow the "Load unpacked" steps above.

---

### 2. Connect an AI Provider

Click the **Harbor** icon → **Settings** → select your provider:

| Provider | Best For | API Source |
|---|---|---|
| **Claude** | Complex reasoning & analysis | [console.anthropic.com] |
| **GPT-4o** | Speed & creative tasks | [platform.openai.com] |
| **Gemini** | Multimodal, free tier | [aistudio.google.com] |
| **Ollama** | Full privacy, local execution | [ollama.com] |
| **OpenRouter** | 100+ models, easy switching | [openrouter.ai] |

---

### 3. Try It Out

Open the Harbor side panel and give it a task:

```text
"Find the top 3 coffee makers on Amazon with 5-star reviews under $50"
"Compare flight prices NYC to London in March across Google Flights"
"Fill this registration form using my info from my LinkedIn profile"
```

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

## Contributing

All contributions are welcome — bugs, features, docs, and ideas.

1. Check [existing issues] first
2. Open a [new issue] or [pull request]
3. Follow the [CONTRIBUTING.md](CONTRIBUTING.md) guidelines

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
