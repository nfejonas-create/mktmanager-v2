# 🚀 COMANDO ÚNICO PARA CLAUDE COWORK

## Objetivo: Deploy completo do PostFlow backend no Render

### Comando a executar:

```bash
cd mktmanager-v2 && ./deploy-render-automatico.sh
```

### Ou passo a passo manual (se o script falhar):

```bash
# 1. Entrar na pasta
cd mktmanager-v2

# 2. Criar/recriar render.yaml
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

# 3. Commitar alterações
git add render.yaml
git commit -m "Configure render.yaml for deploy"
git push origin main

# 4. Instruir usuário para completar no dashboard
echo "✅ Configuração pronta!"
echo "Acesse https://dashboard.render.com/blueprints e clique 'New Blueprint Instance'"
```

### Resultado esperado:
- ✅ Arquivo render.yaml atualizado
- ✅ Commit no repositório
- ✅ Pronto para deploy via Blueprint no Render

### URLs finais após deploy:
- Frontend: https://web-14qxg8bcg-jonas-breitenbachs-projects.vercel.app
- Backend: https://postflow-backend.onrender.com
- API: https://postflow-backend.onrender.com/api
