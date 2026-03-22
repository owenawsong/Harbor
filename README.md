

<div align="center">
  <img src="https://pfst.cf2.poecdn.net/base/image/1bbec1a053e374f75145a00b5044e4852d0e5876ce1d2eb0491232ec4281b900?w=1384&h=768&pmaid=591031806" alt="Harbor Banner" width="800" />
</div>

<br />

<div align="center">
  <img src="https://img.shields.io/badge/BUILD-PASSING-44cc11?style=for-the-badge" alt="Build" /><img src="https://img.shields.io/badge/RELEASE-V2026.3.13--1-007ec6?style=for-the-badge" alt="Release" /><img src="https://img.shields.io/badge/DISCORD-27K%20ONLINE-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord" /><img src="https://img.shields.io/badge/LICENSE-MIT-007ec6?style=for-the-badge" alt="License" />
</div>

<p align="center">
  <b>The open-source AI agent browser extension.</b><br />
  Harbor gives your browser a brain, allowing AI to navigate, interact, and complete complex workflows on any website.
</p>

<p align="center">
  <a href="#quick-start">Get Started</a> &nbsp;•&nbsp;
  <a href="#features">Features</a> &nbsp;•&nbsp;
  <a href="#supported-models">Supported Models</a> &nbsp;•&nbsp;
  <a href="https://harbor-extension.pages.dev/docs">Documentation</a>
</p>

---

## <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/info.svg" width="22" height="22" /> What is Harbor?

Harbor is a powerful Chrome extension designed to transform your browser into an autonomous agent workspace. Unlike standard LLM interfaces, Harbor doesn't just talk about the web—it lives in it. By combining visual perception with direct DOM access, Harbor can perform tasks that previously required human manual labor.

---

## <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/layers.svg" width="22" height="22" /> Core Capabilities

| Icon | Feature | Capability Description |
| :--- | :--- | :--- |
| <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/mouse-pointer-2.svg" width="18" height="18" /> | **Autonomous Action** | Clicks, types, scrolls, and navigates through complex web flows. |
| <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/eye.svg" width="18" height="18" /> | **Visual Perception** | Uses GPT-4o or Claude 3.5 Vision to "see" the page layout. |
| <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/terminal.svg" width="18" height="18" /> | **DOM Intelligence** | Parses the underlying code to find buttons and inputs accurately. |
| <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/shield-check.svg" width="18" height="18" /> | **Privacy First** | All keys are stored locally; no data is sent to Harbor servers. |

---

## <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/zap.svg" width="22" height="22" /> Key Features

### <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/layout.svg" width="18" height="18" /> Comprehensive Browser Tools
Harbor comes packed with **57 built-in tools** that allow the AI to interact with the Chrome environment:
- **Tab Management:** Open, close, switch, and organize tabs dynamically.
- **History & Bookmarks:** Search through your past activity to find relevant context.
- **Downloads:** Manage and trigger file downloads based on agent tasks.
- **Clipboard Access:** Seamlessly move data between the browser and the AI.

### <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/cpu.svg" width="18" height="18" /> Multi-Model Support
Don't be locked into one provider. Harbor supports a wide range of AI backends:
- **Claude 3.5 Sonnet:** The gold standard for web navigation and reasoning.
- **GPT-4o:** High-speed performance with excellent visual understanding.
- **Gemini 1.5 Pro:** Massive context windows for deep research tasks.
- **Ollama:** Run your agents entirely locally for maximum privacy.
- **OpenRouter:** Access hundreds of models through a single unified API.

### <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/settings-2.svg" width="18" height="18" /> Advanced Configuration
- **System Prompts:** Customize exactly how your agent behaves and responds.
- **Context Persistence:** Keep the conversation going across different websites.
- **Custom Toolsets:** Enable or disable specific browser permissions on the fly.
- **Developer Console:** Monitor the agent's thought process and tool calls in real-time.

---

## <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/rocket.svg" width="22" height="22" /> Quick Start

### 1. Installation
Currently, Harbor is available via manual installation for developers:

```bash
# Clone the repository
git clone https://github.com/owenawsong/Harbor.git

# Install dependencies
cd Harbor-Extension
npm install

# Build the extension
npm run build
```

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer Mode** (top right toggle).
3. Click **Load unpacked** and select the `dist` folder in the project directory.

### 2. Configuration
1. Click the Harbor icon in your extension bar.
2. Open **Settings** (<img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/settings.svg" width="14" height="14" />).
3. Enter your API Key for your preferred provider (Anthropic, OpenAI, or Google).
4. Start a conversation and ask the agent to perform a task!

---

## <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/code-2.svg" width="22" height="22" /> Tech Stack

Harbor is built with modern, scalable technologies:
- **Framework:** [React 18](https://reactjs.org/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)

---

## <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/heart.svg" width="22" height="22" /> Contributing

We welcome contributions! Whether it's adding new tools, improving the UI, or fixing bugs:
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/scale.svg" width="22" height="22" /> License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <br />
  <p>Built with passion for the open-source AI community.</p>
  <a href="https://github.com/owenawsong/Harbor"><b>Star this repo</b></a>
</div>

