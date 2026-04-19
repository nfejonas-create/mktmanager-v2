# 🚀 PostFlow - Status de Deploy

## ✅ O que está FUNCIONANDO (Local)

| Componente | Status | URL |
|------------|--------|-----|
| Backend | ✅ Rodando | http://localhost:3001 |
| Frontend | ✅ Rodando | http://localhost:5173 |
| Banco de Dados | ✅ Conectado | Neon PostgreSQL |
| Redis | ✅ Conectado | Railway |
| Publicação LinkedIn | ✅ Funcionando | Via conta Jonas |
| Agendamento | ✅ Funcionando | node-cron ativo |
| Múltiplas Contas | ✅ Funcionando | Jonas + Niulane |

---

## ⚠️ O que precisa de DEPLOY MANUAL

### Problema
O Render não possui mais CLI pública para deploy automático. É necessário usar o dashboard web.

### Solução Imediata: ngrok (Acesso Temporário)

Para acesso externo imediato SEM deploy:

```bash
# 1. Instalar ngrok (se não tiver)
npm install -g ngrok

# 2. Criar conta em https://ngrok.com
# 3. Configurar authtoken
ngrok config add-authtoken SEU_TOKEN

# 4. Expor o backend
ngrok http 3001

# 5. O ngrok mostrará uma URL pública tipo:
# https://abc123.ngrok.io
```

**Limitação:** URL muda a cada reinício do ngrok (a menos que pague pelo plano fixo).

---

## 📋 DEPLOY PERMANENTE (Render + Vercel)

### Passo 1: Backend no Render

1. Acesse: https://dashboard.render.com
2. Clique **"New +"** → **"Blueprint"**
3. Conecte seu repositório GitHub
4. Selecione o arquivo `render.yaml`
5. Configure as variáveis de ambiente:

```
DATABASE_URL=postgresql://neondb_owner:npg_Enj1b8evyxWi@ep-misty-wind-an6f7aar-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require
REDIS_URL=redis://default:gOzMLzjEwJQeXraiERypvqGLKeSpGdnG@redis.railway.internal:6379
ENCRYPTION_KEY=chave-de-32-caracteres-para-teste!!
LINKEDIN_CLIENT_ID=77r1k0xvpegsrg
LINKEDIN_CLIENT_SECRET=WPL_AP1.bNqsRXeS7SoOuGdg.uo98Tw==
LINKEDIN_REDIRECT_URI=https://postflow-backend.onrender.com/api/accounts/linkedin/callback
ANTHROPIC_API_KEY=mock_anthropic_key
```

6. Clique **"Apply"**

### Passo 2: Frontend no Vercel

1. Acesse: https://vercel.com
2. Clique **"Add New Project"**
3. Importe o repositório
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `web`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Adicione a variável:
   ```
   VITE_API_URL=https://postflow-backend.onrender.com/api
   ```
6. Clique **"Deploy"**

### Passo 3: Atualizar LinkedIn OAuth

1. Acesse: https://www.linkedin.com/developers/apps
2. Selecione o app **"CLAUDE POST"**
3. Vá em **"Auth"** → **"Authorized redirect URLs"**
4. Adicione:
   ```
   https://postflow-backend.onrender.com/api/accounts/linkedin/callback
   ```
5. Salve

---

## 🌐 URLs Finais (Após Deploy)

| Serviço | URL |
|---------|-----|
| **Backend** | https://postflow-backend.onrender.com |
| **Frontend** | https://postflow-web.vercel.app |
| **API** | https://postflow-backend.onrender.com/api |
| **Health** | https://postflow-backend.onrender.com/health |

---

## 📱 Acesso no Celular

### Opção A: ngrok (Imediato)
```
1. ngrok http 3001
2. Acesse a URL pública no celular
3. Funciona enquanto o PC estiver ligado
```

### Opção B: Deploy Completo (Permanente)
```
1. Complete o deploy no Render/Vercel
2. Acesse https://postflow-web.vercel.app no celular
3. Sempre disponível
```

---

## 🔧 Testes Pós-Deploy

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

## 🎯 Status Atual

**Core v1:** ✅ 100% Funcional (local)
**Deploy:** ⏳ Aguardando execução manual no dashboard
**Acesso Celular:** ⏳ Disponível após deploy ou via ngrok

**Recomendação:** Executar o deploy manual no Render agora para ter URL permanente.
