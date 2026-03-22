<div align="center">
  <img
    src="https://pfst.cf2.poecdn.net/base/image/1bbec1a053e374f75145a00b5044e4852d0e5876ce1d2eb0491232ec4281b900?w=1384&h=768&pmaid=591031806"
    alt="Harbor — Open Source AI Agent Browser Extension"
    width="680"
  />
</div>

<div align="center">
  <b>Harbor</b> is an open-source Chrome extension that gives your browser real AI agent powers.
  <br />
  Automate tasks, navigate websites, and complete workflows — powered by the AI model you choose.
</div>

<div align="center">
  <br />

  <!-- Status Badges -->
  <a href="https://github.com/owenawsong/Harbor/actions">
    <img src="https://img.shields.io/badge/BUILD-PASSING-44cc11?style=for-the-badge&logo=github" alt="Build Status" />
  </a>
  &nbsp;
  <a href="https://github.com/owenawsong/Harbor/releases">
    <img src="https://img.shields.io/badge/RELEASE-LATEST-007ec6?style=for-the-badge" alt="Latest Release" />
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
  <a href="#how-it-works"><b>How it works</b></a> &nbsp;·&nbsp;
  <a href="#ai-providers"><b>AI providers</b></a> &nbsp;·&nbsp;
  <a href="https://harbor-extension.pages.dev/docs"><b>Docs</b></a> &nbsp;·&nbsp;
  <a href="https://discord.gg/panb3J2xe2"><b>Discord</b></a>
</div>

---

## What is Harbor?

**Harbor is a Chrome extension that runs AI agents inside your browser.**  
Instead of only generating text, Harbor can **control your browser** to complete tasks for you.

Just give it a goal (in plain language) and it will:
- understand what’s on the page (visual + DOM),
- decide the next action,
- click, type, navigate, and extract information,
- and continue until the workflow is complete.

> [!NOTE]
> Harbor is designed to be **privacy-first** and **open-source**, with the option to use different AI models/providers that fit your setup.

---

## Features

### Browser control (agent tools)
- **Browser automation**: tabs, navigation, clipboard, downloads, and more
- **Visual perception**: understands what’s on the screen using screenshots
- **DOM intelligence**: recognizes page structure and adapts to dynamic layouts
- **Smart form handling**: detects inputs and maps your data correctly
- **Self-healing actions**: retries when page elements change

### AI + interaction
- **Real-time streaming** so you can see progress as Harbor acts
- **Context persistence** (optional memory for smoother multi-step work)
- **Provider switching** from the settings panel
- **Command Center** (default **Ctrl+K**) to quickly trigger actions/search
- **Custom profiles** to save configurations per workflow

### Privacy & security
- **Local-first approach** where possible (and transparent behavior where not)
- **No telemetry / no usage analytics** (open-source for auditing)
- **Encrypted API key storage** (stored on your machine)
- **Granular permissions**: decide what the agent is allowed to access

---

## Quick Start

### 1) Install

#### From GitHub (recommended)
```bash
git clone https://github.com/owenawsong/Harbor
cd Harbor-Extension
npm install
npm run build
```

Then load into Chrome:
1. Open `chrome://extensions/`
2. Turn on **Developer Mode**
3. Click **Load unpacked**
4. Select the extension’s `dist/` folder

#### From a Release
1. Download the latest release ZIP
2. Extract it
3. Load unpacked (steps above)

---

### 2) Connect an AI Provider

Click the **Harbor** icon → **Settings** → choose your provider.

| Provider | What it’s best for | Docs / Console |
|---|---|---|
| **OpenAI (ChatGPT-style models)** | Strong general-purpose reasoning + tool use | https://platform.openai.com |
| **Claude (Anthropic)** | Complex analysis and careful outputs | https://console.anthropic.com |
| **Gemini (Google AI)** | Multimodal workflows + flexible options | https://aistudio.google.com |
| **Ollama** | Fully local/private model execution | https://ollama.com |
| **OpenRouter** | Easy switching across 100+ models | https://openrouter.ai |

*(If your exact supported models differ, the docs will reflect the current options.)*

---

### 3) Try it

Open the Harbor side panel and give it a task like:

```text
"Find the best coffee makers on Amazon under $50 with 4+ star reviews."
"Compare flight prices from NYC to London for March and summarize the best option."
"Fill this registration form using the info from my LinkedIn profile."
```

---

## How it works

Harbor is a **Manifest V3** Chrome extension with a decoupled architecture:

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

## AI providers

A good way to understand Harbor’s provider support:

1. **You set the model/provider** you want
2. Harbor sends the task + page context to the selected provider
3. The provider returns actions/next steps
4. Harbor executes those actions in the browser environment

This keeps Harbor flexible: you can swap backends without changing your workflow.

---

## Contributing

All contributions are welcome: **bugs, features, documentation, and ideas**.

1. Check [existing issues]
2. Open a [new issue] or [pull request]
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
