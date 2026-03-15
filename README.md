# Harbor — AI Browser Agent Extension

Harbor brings the power of [BrowserOS's AI agent](https://github.com/browseros-ai/BrowserOS-agent) into a standard Chrome extension you can install in **any Chromium browser** (Chrome, Edge, Brave, Arc, etc.).

## Features

- **Any AI model** — Claude, GPT-4o, Gemini, Ollama (local), OpenRouter, or any OpenAI-compatible API
- **Full browser control** — Navigate, click, type, scroll, take screenshots, fill forms
- **57 browser tools** — Tabs, windows, bookmarks, history, downloads, tab groups, DOM interaction
- **Streaming responses** — See the agent think in real time
- **Side panel UI** — Always-available chat interface
- **Privacy-first** — Your API keys never leave your browser

## Installation

### Option 1: Load as unpacked extension (Developer Mode)

1. Clone the repo and build:
   ```bash
   git clone https://github.com/owenawsong/Harbor-Extension
   cd Harbor-Extension
   npm install
   npm run build
   ```

2. Open Chrome → `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked** → select the `dist/` folder
5. Click the Harbor icon in the toolbar to open the side panel

### Option 2: Pre-built

Download the latest release zip, unzip it, and load the folder via "Load unpacked".

## Setup

1. Click the **H** icon in the Chrome toolbar to open Harbor's side panel
2. Click the **Settings** gear icon
3. Choose your AI provider and enter your API key
4. Start chatting!

### Supported Providers

| Provider | Notes |
|----------|-------|
| **Anthropic (Claude)** | Best for complex tasks. Get key at [console.anthropic.com](https://console.anthropic.com) |
| **OpenAI (GPT)** | Get key at [platform.openai.com](https://platform.openai.com) |
| **Google (Gemini)** | Get key at [aistudio.google.com](https://aistudio.google.com) |
| **Ollama** | Run locally. Set `OLLAMA_ORIGINS=*` before starting Ollama |
| **OpenRouter** | Access 100+ models via one API key |
| **OpenAI-compatible** | LM Studio, Jan, and other local servers |

## Usage Examples

- *"Go to GitHub and find the trending repositories today"*
- *"Search for flights from NYC to London next month and tell me the cheapest option"*
- *"Fill out this form with my information"*
- *"Summarize all my open tabs"*
- *"Download all the PDFs on this page"*
- *"Add all open tabs to a bookmark folder called 'Research'"*

## Architecture

Harbor is a Chrome MV3 extension with three components:

```
background.js      — Service worker: agent loop, AI API calls, tool execution
content.js         — Content script: DOM interaction (click, type, snapshot, etc.)
sidepanel.html     — React UI: chat interface and settings
```

The agent receives your message, calls the AI with the available browser tools, executes tool calls (navigating, clicking, reading content), and streams the response back to the UI.

## Differences from BrowserOS

| Feature | BrowserOS | Harbor Extension |
|---------|-----------|------------------|
| Browser | Custom Chromium fork | Any Chrome/Edge/Brave |
| Server | Local Bun server (port 9100) | Built into service worker |
| CDP access | Yes (deep browser control) | Via chrome.scripting + content script |
| Filesystem | Full read/write | Save via Downloads API |
| Terminal | Yes (native) | Not available |
| MCP servers | Yes (external) | Not available (future work) |
| Installation | Download browser | Load extension |

## Development

```bash
npm install
npm run dev        # Watch mode - rebuilds on changes
npm run build      # Production build
npm run type-check # TypeScript type checking
```

After changing source files in dev mode, go to `chrome://extensions/` and click the refresh button on the Harbor card.

## License

AGPL-3.0 — Same as BrowserOS. See [LICENSE](LICENSE).
