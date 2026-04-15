# backend/server.py
# LangChain-powered prompt optimizer backend
# Supports: Claude (Haiku/Sonnet/Opus), GPT (3.5/4/4o), Gemini, Mistral, Ollama (local)

from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os

app = Flask(__name__)
CORS(app)  # Allow Chrome extension to call this

# ─── System Prompt ────────────────────────────────────────────────────────────
SYSTEM_PROMPT = """You are an expert prompt engineer. The user has typed a basic prompt into an AI chat interface.

Your ONLY job: rewrite that prompt into a highly optimized, clear, and powerful version that will get dramatically better AI responses.

Rules:
- Preserve the original intent exactly
- Add specific context, constraints, and output format where helpful
- Make it clear, structured, and actionable
- Remove vagueness; add precision
- Keep it concise — not unnecessarily long
- Output ONLY the optimized prompt, nothing else. No preamble, no explanation, no quotes."""

# ─── Model Registry ───────────────────────────────────────────────────────────
def get_llm(provider: str, model: str, api_key: str, temperature: float = 0.3):
    if provider == "anthropic":
        from langchain_anthropic import ChatAnthropic
        return ChatAnthropic(
            model=model,
            api_key=api_key,
            temperature=temperature,
            max_tokens=1024
        )

    elif provider == "openai":
        from langchain_openai import ChatOpenAI
        return ChatOpenAI(
            model=model,
            api_key=api_key,
            temperature=temperature,
            max_tokens=1024
        )

    elif provider == "google":
        from langchain_google_genai import ChatGoogleGenerativeAI
        return ChatGoogleGenerativeAI(
            model=model,
            google_api_key=api_key,
            temperature=temperature,
            max_output_tokens=1024
        )

    elif provider == "mistral":
        from langchain_mistralai import ChatMistralAI
        return ChatMistralAI(
            model=model,
            api_key=api_key,
            temperature=temperature,
            max_tokens=1024
        )

    elif provider == "ollama":
        from langchain_ollama import ChatOllama
        return ChatOllama(
            model=model,
            temperature=temperature
        )

    else:
        raise ValueError(f"Unknown provider: {provider}")


# ─── LangChain Chain ──────────────────────────────────────────────────────────
def build_chain(llm):
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "{input}")
    ])
    return prompt | llm | StrOutputParser()


# ─── Routes ───────────────────────────────────────────────────────────────────
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "Prompt Optimizer backend running"})


@app.route("/optimize", methods=["POST"])
def optimize():
    data = request.json

    raw_prompt  = data.get("prompt", "").strip()
    provider    = data.get("provider", "anthropic")
    model       = data.get("model", "claude-3-5-haiku-latest")
    api_key     = data.get("api_key", "")
    temperature = float(data.get("temperature", 0.3))

    if not raw_prompt:
        return jsonify({"error": "prompt is required"}), 400

    if provider != "ollama" and not api_key:
        return jsonify({"error": "api_key is required"}), 400

    try:
        llm   = get_llm(provider, model, api_key, temperature)
        chain = build_chain(llm)
        result = chain.invoke({"input": raw_prompt})
        return jsonify({"optimized": result.strip()})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/models", methods=["GET"])
def models():
    return jsonify({
        "providers": {
            "anthropic": {
                "label": "Anthropic (Claude)",
                "models": [
                    {"id": "claude-3-5-haiku-latest",    "label": "Claude 3.5 Haiku — cheapest, fast"},
                    {"id": "claude-3-5-sonnet-latest",   "label": "Claude 3.5 Sonnet — balanced"},
                    {"id": "claude-3-opus-latest",       "label": "Claude 3 Opus — most powerful"},
                ]
            },
            "openai": {
                "label": "OpenAI (GPT)",
                "models": [
                    {"id": "gpt-4o-mini", "label": "GPT-4o Mini — cheapest"},
                    {"id": "gpt-4o",      "label": "GPT-4o — balanced"},
                    {"id": "gpt-4-turbo", "label": "GPT-4 Turbo — powerful"},
                ]
            },
            "google": {
                "label": "Google (Gemini)",
                "models": [
                    {"id": "gemini-1.5-flash", "label": "Gemini 1.5 Flash — fast"},
                    {"id": "gemini-1.5-pro",   "label": "Gemini 1.5 Pro — powerful"},
                ]
            },
            "mistral": {
                "label": "Mistral AI",
                "models": [
                    {"id": "mistral-small-latest",  "label": "Mistral Small — cheap"},
                    {"id": "mistral-large-latest",  "label": "Mistral Large — powerful"},
                ]
            },
            "ollama": {
                "label": "Ollama (Local — Free)",
                "models": [
                    {"id": "llama3",   "label": "Llama 3 — free local"},
                    {"id": "mistral",  "label": "Mistral — free local"},
                    {"id": "phi3",     "label": "Phi-3 — free local"},
                ]
            }
        }
    })


if __name__ == "__main__":
    print("✦ Prompt Optimizer Backend starting on http://localhost:5000")
    app.run(host="127.0.0.1", port=5000, debug=False)
