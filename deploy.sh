#!/bin/bash
# Deploy PostFlow para Render e Vercel
# Execute: ./deploy.sh

echo "🚀 Iniciando deploy do PostFlow..."

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}⚠️  IMPORTANTE: Este script requer:${NC}"
echo "1. Conta no Render (https://dashboard.render.com)"
echo "2. Conta no Vercel (https://vercel.com)"
echo "3. Variáveis de ambiente configuradas"
echo ""

# Verificar se está no diretório correto
if [ ! -f "render.yaml" ]; then
    echo -e "${RED}❌ Erro: render.yaml não encontrado${NC}"
    echo "Execute este script na raiz do projeto mktmanager-v2"
    exit 1
fi

echo -e "${GREEN}✅ Configuração encontrada${NC}"
echo ""

# Instruções de Deploy
echo "📋 PASSOS PARA DEPLOY MANUAL:"
echo ""
echo "=== 1. BACKEND NO RENDER ==="
echo "   Acesse: https://dashboard.render.com"
echo "   1. Clique 'New +' → 'Blueprint'"
echo "   2. Conecte seu repositório GitHub"
echo "   3. Selecione o arquivo render.yaml"
echo "   4. Configure as variáveis de ambiente:"
echo ""
echo "   DATABASE_URL=postgresql://neondb_owner:****@ep-****.neon.tech/neondb?sslmode=require"
echo "   REDIS_URL=redis://default:****@redis.railway.internal:6379"
echo "   ENCRYPTION_KEY=chave-de-32-caracteres-para-teste!!"
echo "   LINKEDIN_CLIENT_ID=77r1k0xvpegsrg"
echo "   LINKEDIN_CLIENT_SECRET=WPL_AP1.bNqsRXeS7SoOuGdg.uo98Tw=="
echo "   LINKEDIN_REDIRECT_URI=https://postflow-backend.onrender.com/api/accounts/linkedin/callback"
echo "   ANTHROPIC_API_KEY=mock_anthropic_key"
echo ""
echo "   5. Clique 'Apply' e aguarde o deploy"
echo ""

echo "=== 2. FRONTEND NO VERCEL ==="
echo "   Acesse: https://vercel.com"
echo "   1. Clique 'Add New Project'"
echo "   2. Importe o repositório"
echo "   3. Configure:"
echo "      - Framework Preset: Vite"
echo "      - Root Directory: web"
echo "      - Build Command: npm run build"
echo "      - Output Directory: dist"
echo "   4. Adicione a variável de ambiente:"
echo "      VITE_API_URL=https://postflow-backend.onrender.com/api"
echo "   5. Clique 'Deploy'"
echo ""

echo "=== 3. ATUALIZAR LINKEDIN OAUTH ==="
echo "   Acesse: https://www.linkedin.com/developers/apps"
echo "   1. Selecione o app 'CLAUDE POST'"
echo "   2. Em 'Auth' → 'Authorized redirect URLs'"
echo "   3. Adicione:"
echo "      https://postflow-backend.onrender.com/api/accounts/linkedin/callback"
echo "   4. Salve as alterações"
echo ""

echo -e "${GREEN}🎉 Após esses passos, suas URLs serão:${NC}"
echo "   Backend: https://postflow-backend.onrender.com"
echo "   Frontend: https://postflow-web.vercel.app"
echo ""
echo -e "${YELLOW}⚠️  Nota: O deploy automático via CLI não está disponível.${NC}"
echo "   O Render exige configuração manual via dashboard para novos serviços."
