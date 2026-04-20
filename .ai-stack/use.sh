#!/usr/bin/env bash
# AI-STACK MODEL SWITCHER (Linux/Mac)
# Uso: bash use.sh <modelo>

MODEL="${1:-sonnet}"

# Carrega keys
[ -f "$HOME/.ai-stack.env" ] && { set -a; source "$HOME/.ai-stack.env"; set +a; }

case "$MODEL" in
    claude|sonnet) aider --model sonnet ;;
    opus)          aider --model claude-opus-4-6 ;;
    haiku)         aider --model claude-haiku-4-5 ;;
    gpt)           aider --model gpt-5 ;;
    gemini)        aider --model gemini/gemini-2.5-pro ;;
    deepseek)      aider --model deepseek/deepseek-coder ;;
    local)         aider --model ollama/deepseek-coder-v2 ;;
    *)
        echo "Modelos: claude sonnet opus haiku gpt gemini deepseek local"
        exit 1
        ;;
esac
