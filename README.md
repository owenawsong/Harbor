
<div align="center">
  <img src="https://pfst.cf2.poecdn.net/base/image/1bbec1a053e374f75145a00b5044e4852d0e5876ce1d2eb0491232ec4281b900?w=1384&h=768&pmaid=591031806" alt="Harbor — Open Source AI Agent Browser Extension" width="680" />
</div>

<br />

<p align="center">
  The open-source Chrome extension that gives your browser real AI agent powers.<br />
  Automate tasks, navigate websites, and complete workflows — powered by any AI model you choose.
</p>

<br />

<p align="center">
  <a href="LICENSE">
    <img src="https://pfst.cf2.poecdn.net/base/image/2c89badab92b5ee0afea1a6328677fab597eaa5d90b21f6a29384f9eaac3cbc0?pmaid=591031803" alt="License: MIT" />
  </a>
  &nbsp;
  <a href="https://github.com/owenawsong/Harbor">
    <img src="https://pfst.cf2.poecdn.net/base/image/53b6c7e373f1aee22c3d89eccbf355149aae91f75048889139007e70956cab62?pmaid=591031801" alt="GitHub: Open Source" />
  </a>
  &nbsp;
  <a href="https://discord.gg/panb3J2xe2">
    <img src="https://pfst.cf2.poecdn.net/base/image/6364574fa7653f85ee884c100b7fdcd5eaf41ca5f24d95ed9a8893d97517b124?pmaid=591031802" alt="Discord: Join us" />
  </a>
  &nbsp;
  <img src="https://pfst.cf2.poecdn.net/base/image/9f98501990b44139eb1fe46af82683aa48280359c3592836213acc74118f6f9e?pmaid=591031804" alt="TypeScript: 5.6" />
  &nbsp;
  <img src="https://pfst.cf2.poecdn.net/base/image/1079f5a1a757ee14edbf87e44e659bf4085212de7685d8de990e22bba60befd5?pmaid=591031805" alt="React: 18" />
</p>

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

| | |
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

### 🛠️ Browser Control
- **57 Browser Tools** — Tabs, bookmarks, downloads, history, clipboard, and more
- **Real-time Screenshots** — The AI sees exactly what's on your screen at every step
- **Intelligent Navigation** — Understands page structure and adapts dynamically
- **Form Intelligence** — Detects input types and fills them correctly
- **Error Recovery** — Automatically retries when actions don't go as planned

### 🧠 AI & Interface
- **Streaming Responses** — Watch the agent reason and act in real-time
- **Conversation Memory** — Optional context that persists across sessions
- **Multi-model Support** — Switch between providers instantly in settings
- **Command Palette** — `Ctrl+K` for quick access to anything
- **Settings Profiles** — Save and switch between model configurations

### 🔒 Privacy & Security
- **100% Local** — Conversations never leave your device
- **No Telemetry** — Zero usage tracking, zero data collection
- **Encrypted Storage** — API keys encrypted locally, never sent to our servers
- **Fully Open Source** — Read and audit every line of code
- **Selective Access** — You control exactly what data the AI can see

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

[Download the latest release →](https://github.com/owenawsong/Harbor/releases)  
Extract the ZIP, then follow the Load unpacked steps above.

**Chrome Web Store**  
Coming soon — currently in review.

---

### 2. Connect an AI Provider

Click the **⛵ Harbor** icon → **Settings** ⚙️ → select your provider:

| Provider | Best For | Cost | API Key |
|---|---|---|---|
| **Claude** | Complex reasoning & analysis | ~$3–15/mo | [console.anthropic.com](https://console.anthropic.com) |
| **GPT-4o** | Speed & creative tasks | ~$5–20/mo | [platform.openai.com](https://platform.openai.com) |
| **Gemini** | Multimodal, free tier | Free / pay-as-you-go | [aistudio.google.com](https://aistudio.google.com) |
| **Ollama** | Full privacy, zero API cost | Free (runs locally) | [ollama.com](https://ollama.com) |
| **OpenRouter** | 100+ models, easy switching | Pay-per-use | [openrouter.ai](https://openrouter.ai) |

Paste your key → **Save** → done.

---

### 3. Try It Out

Open the Harbor side panel and give it a task in plain English:

```
"Find the top 3 coffee makers on Amazon with 5-star reviews under $50"
→ Searches Amazon, filters by rating and price, opens results in tabs

"Compare flight prices NYC → London in March across Google Flights and Kayak"
→ Visits both sites, extracts prices, returns a comparison

"Fill this registration form using my info from my LinkedIn profile"
→ Reads your LinkedIn, maps the fields, auto-fills the entire form
```

---

## Architecture

Harbor is built as a **Chrome Manifest V3 extension** with React and TypeScript.

```
┌──────────────────────────────────────┐
│         React Side Panel             │  ←  Chat, Settings, History
└──────────────────┬───────────────────┘
                   │  Chrome Messages
┌──────────────────┴───────────────────┐
│      Service Worker (background)     │  ←  Agent loop, AI API calls
└──────────────────┬───────────────────┘
                   │  DOM Commands
┌──────────────────┴───────────────────┐
│           Content Script             │  ←  Click, type, screenshot
└──────────────────────────────────────┘
```

**How a task runs:**
1. You type a task in the side panel
2. The service worker sends it to your AI provider with the full tool list
3. The AI responds with tool calls — e.g. `navigate_to`, `click_element`, `fill_input`
4. The content script executes those actions on the live page
5. A screenshot and result are fed back to the AI for the next step
6. The loop continues until the task is complete
7. The final response is streamed back to you

### Project Structure

```
src/
├── sidepanel/          # React UI — Chat, Settings, Dashboard
├── background/
│   ├── agent/          # Core agent loop
│   └── tools/          # 57 browser tool definitions
├── content/            # Page interaction & UI overlays
├── shared/             # Types, constants, utilities
└── styles/             # Tailwind CSS + global styles
```

---

## Development

```bash
# Install dependencies
npm install

# Start with auto-rebuild on file changes
npm run dev

# Production build
npm run build

# Type checking
npm run type-check
```

> **Tip:** After editing, go to `chrome://extensions/` and click the **reload** icon on the Harbor card to apply changes.

---

## Roadmap

- [ ] Chrome Web Store listing
- [ ] Firefox support
- [ ] MCP (Model Context Protocol) server integration
- [ ] Scheduled & recurring tasks
- [ ] Advanced persistent memory
- [ ] Custom user-defined tools
- [ ] No-code visual workflow builder
- [ ] Optional privacy-preserving cloud sync

[Suggest a feature →](https://github.com/owenawsong/Harbor/issues/new?template=feature_request.md)

---

## Contributing

All contributions are welcome — bugs, features, docs, and ideas.

1. Check [existing issues](https://github.com/owenawsong/Harbor/issues) first
2. Open a [new issue](https://github.com/owenawsong/Harbor/issues/new) or [pull request](https://github.com/owenawsong/Harbor/pulls)
3. Follow the [CONTRIBUTING.md](CONTRIBUTING.md) guidelines
4. Make sure everything passes: `npm run type-check && npm run build`

Please review [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before getting started.

---

## License

**MIT** — Free for personal and commercial use. See [LICENSE](LICENSE) for full details.

---

<div align="center">
  <br />
  Built with React 18, TypeScript 5.6, Vite, and Tailwind CSS.
  <br /><br />
  <a href="https://github.com/owenawsong/Harbor"><b>⭐ Star on GitHub</b></a> &nbsp;·&nbsp;
  <a href="#quick-start"><b>🚀 Get Started</b></a> &nbsp;·&nbsp;
  <a href="https://discord.gg/panb3J2xe2"><b>💬 Join the Community</b></a>
  <br /><br />
</div>

