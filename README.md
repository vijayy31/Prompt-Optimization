# Optimize Prompt — LangChain Edition

Switch between ANY AI model anytime — Claude, GPT, Gemini, Mistral, or free local Ollama.

## Architecture

```
Chrome Extension (button in chatbox)
        ↓  POST /optimize
Local Python Server (LangChain)
        ↓  routes to selected model
Claude / GPT / Gemini / Mistral / Ollama
```

## Quick Start

### Step 1 — Start the backend

**Mac / Linux:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
```
Double-click start.bat
```

Keep this terminal open. Backend runs at http://localhost:5000

### Step 2 — Install extension in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select this folder
4. ✦ icon appears in toolbar

### Step 3 — Configure model

1. Click the ✦ icon
2. Choose Provider + Model
3. Paste your API key
4. Click **Save & Activate**

### Step 4 — Use it

Open ChatGPT / Claude / Gemini → type prompt → click **✦ Optimize Prompt**

---

## Switching Models

Just click the ✦ icon and change provider/model — no restart needed.

| Provider  | Key location                    | Cost     |
|-----------|---------------------------------|----------|
| Anthropic | console.anthropic.com           | ~$1–5/MTok |
| OpenAI    | platform.openai.com/api-keys    | ~$0.15–10/MTok |
| Google    | aistudio.google.com             | Free tier available |
| Mistral   | console.mistral.ai              | ~€0.1–2/MTok |
| Ollama    | No key needed — runs locally!   | FREE     |

---

## Free Option — Ollama (100% local)

1. Install: https://ollama.com/download
2. Run: `ollama pull llama3`
3. Run: `ollama serve`
4. In extension: select **Ollama** → **Llama 3** → Save

No API key, no cost, runs fully offline.
