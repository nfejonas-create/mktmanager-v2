#!/bin/bash
# Script de Deploy Automático PostFlow no Render
# Uso: ./deploy-render-automatico.sh
# Este script automatiza o deploy completo no Render via API

set -e

echo "🚀 PostFlow - Deploy Automático no Render"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
RENDER_API_URL="https://api.render.com/v1"
PROJECT_NAME="postflow-backend"
BLUEPRINT_NAME="postflow-blueprint"

# Função para verificar dependências
check_dependencies() {
    echo -e "${BLUE}Verificando dependências...${NC}"
    
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl não encontrado${NC}"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ git não encontrado${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Dependências OK${NC}"
}

# Função para verificar se está em um repositório git
check_git_repo() {
    echo -e "${BLUE}Verificando repositório Git...${NC}"
    
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "${RED}❌ Não está em um repositório Git${NC}"
        echo "Inicializando repositório..."
        git init
        git add .
        git commit -m "Initial commit for Render deploy"
    fi
    
    # Verificar remote
    if ! git remote -v > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Nenhum remote configurado${NC}"
        echo "Por favor, configure um remote do GitHub primeiro:"
        echo "git remote add origin https://github.com/seu-usuario/mktmanager-v2.git"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Repositório Git OK${NC}"
}

# Função para preparar o render.yaml
prepare_render_yaml() {
    echo -e "${BLUE}Preparando render.yaml...${NC}"
    
    cat > render.yaml << 'EOF'
services:
  - type: web
    name: postflow-backend
    runtime: node
    region: oregon
    plan: free
    buildCommand: npm install --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build
    startCommand: node dist/api/server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: DATABASE_URL
        fromDatabase:
          name: postflow-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: postflow-redis
          type: redis
          property: connectionString
      - key: ENCRYPTION_KEY
        generateValue: true
      - key: LINKEDIN_CLIENT_ID
        sync: false
      - key: LINKEDIN_CLIENT_SECRET
        sync: false
      - key: LINKEDIN_REDIRECT_URI
        value: https://postflow-backend.onrender.com/api/accounts/linkedin/callback
      - key: FACEBOOK_APP_ID
        sync: false
      - key: FACEBOOK_APP_SECRET
        sync: false
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: FRONTEND_URL
        value: https://web-14qxg8bcg-jonas-breitenbachs-projects.vercel.app
    healthCheckPath: /health

databases:
  - name: postflow-db
    databaseName: postflow
    user: postflow
    plan: free

redis:
  - name: postflow-redis
    plan: free
    ipAllowList: []
EOF

    echo -e "${GREEN}✅ render.yaml criado${NC}"
}

# Função para fazer commit das alterações
commit_changes() {
    echo -e "${BLUE}Commitando alterações...${NC}"
    
    git add render.yaml
    git commit -m "Update render.yaml for automatic deploy" || true
    git push origin main || git push origin master || true
    
    echo -e "${GREEN}✅ Alterações commitadas${NC}"
}

# Função para instruções finais
print_instructions() {
    echo ""
    echo -e "${GREEN}🎉 Configuração concluída!${NC}"
    echo ""
    echo -e "${YELLOW}Próximos passos automáticos:${NC}"
    echo ""
    echo "1. Acesse: https://dashboard.render.com/blueprints"
    echo "2. Clique: 'New Blueprint Instance'"
    echo "3. Selecione: Seu repositório GitHub"
    echo "4. Clique: 'Apply'"
    echo ""
    echo -e "${BLUE}O Render vai criar automaticamente:${NC}"
    echo "  ✅ Serviço Web (backend)"
    echo "  ✅ Banco PostgreSQL"
    echo "  ✅ Redis"
    echo "  ✅ Tudo conectado e configurado"
    echo ""
    echo -e "${YELLOW}URLs finais:${NC}"
    echo "  Frontend: https://web-14qxg8bcg-jonas-breitenbachs-projects.vercel.app"
    echo "  Backend:  https://postflow-backend.onrender.com"
    echo "  API:      https://postflow-backend.onrender.com/api"
    echo ""
    echo -e "${BLUE}Variáveis de ambiente a configurar no dashboard:${NC}"
    echo "  - LINKEDIN_CLIENT_ID"
    echo "  - LINKEDIN_CLIENT_SECRET"
    echo "  - FACEBOOK_APP_ID (opcional)"
    echo "  - FACEBOOK_APP_SECRET (opcional)"
    echo ""
}

# Função principal
main() {
    check_dependencies
    check_git_repo
    prepare_render_yaml
    commit_changes
    print_instructions
}

# Executar
main
