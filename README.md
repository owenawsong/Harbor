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
  <div style="margin-top: 10px;">

    <!-- Status Badges (kept in a tight row; no &nbsp; to avoid seams/odd spacing) -->
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

  <div style="margin-top: 8px;">
    <!-- Tech Stack Badges -->
    <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/Vite-5.0-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  </div>

  <br />

  <a href="#quick-start"><b>Get Started</b></a> &nbsp;·&nbsp;
  <a href="#what-is-harbor"><b>What is Harbor?</b></a> &nbsp;·&nbsp;
  <a href="#features"><b>Features</b></a> &nbsp;·&nbsp;
  <a href="#how-it-works"><b>How it works</b></a> &nbsp;·&nbsp;
  <a href="https://harbor-extension.pages.dev/docs"><b>Docs</b></a> &nbsp;·&nbsp;
  <a href="https://discord.gg/panb3J2xe2"><b>Discord</b></a>
</div>

---

## What is Harbor?

**Harbor is a Chrome extension that runs AI agents inside your browser.**  
Instead of only answering questions, Harbor can **control your browser** to complete tasks end-to-end.

Tell Harbor what you want to achieve and it will:
- understand what’s on the page (visual + DOM),
- choose the next action,
- click/type/navigate as needed,
- extract and summarize results,
- keep going until the workflow is finished.

> [!NOTE]
> Harbor is **open-source** and built with a **privacy-first mindset**. You choose the AI model/provider—Harbor doesn’t lock you into one backend.

---

## Features

### Browser control (agent tools)
- **Browser automation** for real workflows (tabs, downloads, navigation, clipboard, etc.)
- **Visual perception** using live screenshots of the active tab
- **DOM intelligence** to understand page structure and handle dynamic layouts
- **Smart form support** (detects inputs and maps values correctly)
- **Self-healing** retries when elements change

### AI + interaction
- **Real-time streaming** updates as the agent works
- **Context persistence** (optional memory)
- **Provider switching** in settings
- **Command Center** (default: **Ctrl+K**) to trigger actions quickly
- **Custom profiles** for different tasks/models

### Privacy & security
- **No telemetry / no usage analytics** (open-source auditability)
- **Encrypted API key storage** (keys stay on your machine)
- **Granular permissions**: you decide what the agent can access

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

Load into Chrome:
1. Open `chrome://extensions/`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select the project’s `dist/` folder

#### From a Release
1. Download the latest release ZIP from the repo
2. Extract it
3. Load unpacked (steps above)

---

### 2) Connect an AI Provider

Open Harbor → **Settings** → select your provider.

Common options include:
- **OpenAI (ChatGPT-style models)** via platform.openai.com
- **Claude (Anthropic)** via console.anthropic.com
- **Gemini (Google AI)** via aistudio.google.com
- **Ollama** for local model execution via ollama.com
- **OpenRouter** for model switching via openrouter.ai

> If your supported providers/models differ from the list above, follow what your current Harbor UI/docs show—those are the source of truth.

---

### 3) Try it

Open Harbor’s side panel and try a task like:

```text
"Find the best coffee makers under $50 with 4+ star reviews."
"Compare flight prices from NYC to London for March and summarize the best option."
"Fill this registration form using my LinkedIn details."
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

## Contributing

Contributions are welcome: **bugs, features, docs, ideas**.

1. Check [existing issues]
2. Open a [new issue] or [pull request]
3. Follow [CONTRIBUTING.md](CONTRIBUTING.md)

---

## License

**MIT** — Free for personal and commercial use. See [LICENSE](LICENSE) for details.

---

<div align="center">
  <br />
  Built with React 18, TypeScript, Vite, and Tailwind CSS.
  <br /><br />
  <a href="https://github.com/owenawsong/Harbor"><b>Star on GitHub</b></a> &nbsp;·&nbsp;
  <a href="#quick-start"><b>Get Started</b></a> &nbsp;·&nbsp;
  <a href="https://discord.gg/panb3J2xe2"><b>Join the Community</b></a>
  <br /><br />
</div>
