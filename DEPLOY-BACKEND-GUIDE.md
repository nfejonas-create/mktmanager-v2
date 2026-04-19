# 🚀 Deploy PostFlow Backend no Render - Guia Passo a Passo

## 📋 Pré-requisitos

- Conta no Render: https://dashboard.render.com
- Repositório GitHub com o código do mktmanager-v2

---

## 🔧 Passo 1: Criar Serviço Web no Render

1. Acesse: https://dashboard.render.com
2. Clique em **"New +"** (botão azul no topo)
3. Selecione **"Web Service"**

---

## 🔧 Passo 2: Conectar Repositório

1. Escolha **"Build and deploy from a Git repository"**
2. Clique em **"Next"**
3. Conecte sua conta GitHub (se ainda não estiver conectada)
4. Selecione o repositório do `mktmanager-v2`
5. Clique em **"Connect"**

---

## 🔧 Passo 3: Configurar Serviço

### Informações Básicas:
| Campo | Valor |
|-------|-------|
| **Name** | `postflow-backend` |
| **Region** | `Oregon (US West)` |
| **Branch** | `main` (ou sua branch principal) |
| **Runtime** | `Node` |

### Build Command:
```bash
npm install --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build
```

### Start Command:
```bash
node dist/api/server.js
```

### Plan: `Free`

---

## 🔧 Passo 4: Configurar Variáveis de Ambiente

Clique em **"Advanced"** → **"Add Environment Variable"**

Adicione estas variáveis:

### Obrigatórias:

```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://neondb_owner:npg_Enj1b8evyxWi@ep-misty-wind-an6f7aar-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require
REDIS_URL=redis://default:gOzMLzjEwJQeXraiERypvqGLKeSpGdnG@redis.railway.internal:6379
ENCRYPTION_KEY=chave-de-32-caracteres-para-teste!!
FRONTEND_URL=https://web-14qxg8bcg-jonas-breitenbachs-projects.vercel.app
```

### LinkedIn OAuth:
```
LINKEDIN_CLIENT_ID=77r1k0xvpegsrg
LINKEDIN_CLIENT_SECRET=WPL_AP1.bNqsRXeS7SoOuGdg.uo98Tw==
LINKEDIN_REDIRECT_URI=https://postflow-backend.onrender.com/api/accounts/linkedin/callback
```

### Outras:
```
ANTHROPIC_API_KEY=mock_anthropic_key
FACEBOOK_APP_ID=mock_facebook_app_id
FACEBOOK_APP_SECRET=mock_facebook_app_secret
```

---

## 🔧 Passo 5: Configurar Health Check

Em **"Health Check Path"**, digite:
```
/health
```

---

## 🔧 Passo 6: Criar Serviço

1. Clique em **"Create Web Service"**
2. Aguarde o build (pode levar 2-5 minutos)
3. Acompanhe os logs no dashboard

---

## ✅ Verificação Pós-Deploy

### Teste o Health Check:
```bash
curl https://postflow-backend.onrender.com/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-19T21:30:00.000Z"
}
```

### Teste os Endpoints:

1. **Listar contas:**
```bash
curl https://postflow-backend.onrender.com/api/accounts
```

2. **Listar posts:**
```bash
curl https://postflow-backend.onrender.com/api/posts
```

---

## 🔗 URLs Finais

| Serviço | URL |
|---------|-----|
| **Frontend** | https://web-14qxg8bcg-jonas-breitenbachs-projects.vercel.app |
| **Backend** | https://postflow-backend.onrender.com |
| **API** | https://postflow-backend.onrender.com/api |
| **Health** | https://postflow-backend.onrender.com/health |

---

## ⚠️ Troubleshooting

### Erro: "Build failed"
- Verifique se o `render.yaml` está na raiz
- Confirme que todas as variáveis de ambiente estão configuradas

### Erro: "Database connection failed"
- Verifique se a `DATABASE_URL` está correta
- Confirme que o Neon permite conexões do IP do Render

### Erro: "Redis connection failed"
- Verifique se a `REDIS_URL` está correta
- Confirme que o Railway Redis está online

### Erro: "Port already in use"
- A variável `PORT` deve ser `3001` (ou deixe o Render definir)

---

## 📝 Checklist Final

- [ ] Serviço criado no Render
- [ ] Repositório conectado
- [ ] Build command configurado
- [ ] Start command configurado
- [ ] Variáveis de ambiente adicionadas
- [ ] Health check configurado
- [ ] Deploy concluído com sucesso
- [ ] Health endpoint responde 200
- [ ] Frontend conecta ao backend

---

**Após completar o deploy, o PostFlow estará 100% online! 🎉**
