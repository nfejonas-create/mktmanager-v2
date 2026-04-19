#!/bin/bash
# Deploy PostFlow Backend no Render
# Execute este script ou siga os passos manualmente

echo "🚀 Deploy PostFlow Backend no Render"
echo ""

# Verificar se render CLI está instalado
if ! command -v render &> /dev/null; then
    echo "⚠️  Render CLI não encontrado"
    echo "Instalando..."
    npm install -g @render/cli
fi

# Deploy usando blueprint
echo "📦 Iniciando deploy..."
render blueprint apply

echo ""
echo "✅ Deploy iniciado!"
echo ""
echo "Acesse o dashboard para acompanhar:"
echo "https://dashboard.render.com"
