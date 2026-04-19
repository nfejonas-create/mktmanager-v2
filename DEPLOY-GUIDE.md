# PostFlow - Configuração de Deploy

## URLs Previstas

### Backend (Render)
**URL:** https://postflow-backend.onrender.com
**Health Check:** https://postflow-backend.onrender.com/health

### Frontend (Vercel)
**URL:** https://postflow-web.vercel.app

---

## Configuração Render (Backend)

### Build Command
```bash
npm install --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build
```

### Start Command
```bash
node dist/api/server.js
```

### Environment Variables
| Variável | Valor | Origem |
|----------|-------|--------|
| NODE_ENV | production | - |
| PORT | 3001 | - |
| DATABASE_URL | postgresql://... | Neon |
| REDIS_URL | redis://... | Railway |
| ENCRYPTION_KEY | chave-32-caracteres | Gerar nova |
| LINKEDIN_CLIENT_ID | 77r1k0xvpegsrg | Mesmo do v1 |
| LINKEDIN_CLIENT_SECRET | WPL_AP1... | Mesmo do v1 |
| LINKEDIN_REDIRECT_URI | https://postflow-backend.onrender.com/api/accounts/linkedin/callback | Nova |
| FACEBOOK_APP_ID | - | Do v1 |
| FACEBOOK_APP_SECRET | - | Do v1 |
| ANTHROPIC_API_KEY | mock_anthropic_key | Mock por enquanto |
| FRONTEND_URL | https://postflow-web.vercel.app | Nova |

---

## Configuração Vercel (Frontend)

### Build Command
```bash
npm run build
```

### Environment Variables
| Variável | Valor |
|----------|-------|
| VITE_API_URL | https://postflow-backend.onrender.com/api |

---

## Passos para Deploy

### 1. Backend no Render
1. Acessar https://dashboard.render.com
2. Clicar "New +" → "Blueprint"
3. Conectar repositório GitHub
4. Selecionar `render.yaml`
5. Configurar variáveis de ambiente
6. Deploy

### 2. Frontend no Vercel
1. Acessar https://vercel.com
2. Importar projeto
3. Root Directory: `web`
4. Configurar `VITE_API_URL`
5. Deploy

### 3. Atualizar LinkedIn OAuth
1. Acessar https://www.linkedin.com/developers/apps
2. Adicionar Redirect URI:
   - `https://postflow-backend.onrender.com/api/accounts/linkedin/callback`
3. Salvar

---

## Testes Pós-Deploy

```bash
# Health check
curl https://postflow-backend.onrender.com/health

# Criar conta
curl -X POST https://postflow-backend.onrender.com/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"platform":"LINKEDIN","accountName":"Test","accessToken":"test","externalId":"test"}'

# Listar posts
curl https://postflow-backend.onrender.com/api/posts
```

---

## Acesso Local vs Online

| Ambiente | Backend | Frontend |
|----------|---------|----------|
| Local | http://localhost:3001 | http://localhost:5173 |
| Online | https://postflow-backend.onrender.com | https://postflow-web.vercel.app |
