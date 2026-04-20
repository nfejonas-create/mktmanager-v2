#!/usr/bin/env bash
# AI-STACK INSTALLER (Linux/Mac)
# Uso: bash install.sh

set -e

echo "=== AI-Stack Installer ==="

# 1. Pré-requisitos
echo ""
echo "[1/5] Verificando pré-requisitos..."
command -v node >/dev/null || { echo "❌ Node.js não encontrado"; exit 1; }
command -v python3 >/dev/null || { echo "❌ Python3 não encontrado"; exit 1; }
command -v git >/dev/null || { echo "❌ Git não encontrado"; exit 1; }
echo "  ✓ Node $(node -v) / Python $(python3 --version) / Git ok"

# 2. Claude Code
echo ""
echo "[2/5] Instalando Claude Code..."
if command -v claude >/dev/null; then
    echo "  ✓ Já instalado"
else
    npm install -g @anthropic-ai/claude-code
fi

# 3. Aider
echo ""
echo "[3/5] Instalando Aider..."
if command -v aider >/dev/null; then
    echo "  ✓ Já instalado"
else
    python3 -m pip install --user aider-install
    python3 -m aider_install
fi

# 4. API keys file
echo ""
echo "[4/5] Configurando API keys..."
ENV_FILE="$HOME/.ai-stack.env"
if [ ! -f "$ENV_FILE" ]; then
    cat > "$ENV_FILE" <<EOF
# AI-STACK API KEYS — NÃO COMMITAR
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
EOF
    echo "  ✓ Criado: $ENV_FILE"
    echo "  ⚠️  Edite e cole suas keys"
else
    echo "  ✓ Já existe: $ENV_FILE"
fi

# 5. Loader no shell rc
echo ""
echo "[5/5] Instalando loader..."
SHELL_RC="$HOME/.bashrc"
[ -n "$ZSH_VERSION" ] && SHELL_RC="$HOME/.zshrc"

LOADER='
# === AI-STACK KEYS LOADER ===
if [ -f "$HOME/.ai-stack.env" ]; then
    set -a; source "$HOME/.ai-stack.env"; set +a
fi
# === END AI-STACK ===
'

if ! grep -q "AI-STACK KEYS LOADER" "$SHELL_RC" 2>/dev/null; then
    echo "$LOADER" >> "$SHELL_RC"
    echo "  ✓ Loader adicionado em $SHELL_RC"
else
    echo "  ✓ Loader já presente"
fi

echo ""
echo "=== INSTALAÇÃO COMPLETA ==="
echo ""
echo "PRÓXIMOS PASSOS:"
echo "  1. Edite keys: $ENV_FILE"
echo "  2. Reabra o terminal (ou: source $SHELL_RC)"
echo "  3. Use: claude  OU  bash .ai-stack/use.sh gemini"
