#!/bin/bash
# ✦ Prompt Optimizer — Start Backend
# Run this once before using the extension

echo ""
echo "✦ Prompt Optimizer — LangChain Backend"
echo "────────────────────────────────────────"

cd "$(dirname "$0")/backend"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Install from https://python.org"
    exit 1
fi

# Create venv if not exists
if [ ! -d "venv" ]; then
    echo "→ Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv
source venv/bin/activate

# Install dependencies
echo "→ Installing dependencies..."
pip install -q -r requirements.txt

echo ""
echo "✅ Starting server on http://localhost:5000"
echo "   Keep this terminal open while using the extension."
echo "   Press Ctrl+C to stop."
echo ""

python3 server.py
