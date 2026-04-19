# SMOKE TEST STATUS - mktmanager-v2

**Data:** 2026-04-15
**Status:** ⏳ AGUARDANDO UPSTASH REDIS

---

## ✅ Neon PostgreSQL - CONFIGURADO

**Database URL:**
```
postgresql://neondb_owner:npg_Enj1b8evyxWi@ep-misty-wind-an6f7aar-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Configuração:**
- Host: `ep-misty-wind-an6f7aar-pooler.c-6.us-east-1.aws.neon.tech`
- Database: `neondb`
- User: `neondb_owner`
- SSL: Obrigatório
- Pooler: Ativo

---

## ⏳ Upstash Redis - PENDENTE

**Próxima ação:** Criar banco em https://console.upstash.com

**Passos:**
1. Acessar https://console.upstash.com
2. Sign up / Login
3. "Create Database"
4. Nome: `mktmanager-v2-redis`
5. Região: `us-east-1` (mesma do Neon)
6. Tipo: `Regional` (free tier)
7. Copiar endpoint Redis

---

## Configuração .env (Manual)

Criar arquivo `.env` na raiz do projeto com:

```env
# Neon PostgreSQL
DATABASE_URL="postgresql://neondb_owner:npg_Enj1b8evyxWi@ep-misty-wind-an6f7aar-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Upstash Redis (colar após criar)
REDIS_URL="redis://default:SENHA@HOST.upstash.io:6379"

# Security (32 caracteres)
ENCRYPTION_KEY="sua-chave-32-caracteres-aqui!!"

# OAuth Mock
LINKEDIN_CLIENT_ID="mock_linkedin"
LINKEDIN_CLIENT_SECRET="mock_secret"
LINKEDIN_REDIRECT_URI="http://localhost:3001/api/accounts/linkedin/callback"

FACEBOOK_APP_ID="mock_facebook"
FACEBOOK_APP_SECRET="mock_secret"
FACEBOOK_REDIRECT_URI="http://localhost:3001/api/accounts/facebook/callback"

# AI Mock
ANTHROPIC_API_KEY="mock_claude"

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:5173"
```

---

## Após Ter Upstash - Executar

### 1. Instalar dependências
```bash
cd mktmanager-v2
npm install
```

### 2. Testar Neon
```bash
npx prisma db pull
npx prisma migrate dev --name init
```

### 3. Testar Redis
```bash
npx redis-cli -u "$REDIS_URL" ping
```

### 4. Iniciar serviços (3 terminais)
```bash
# Terminal 1: Worker
npm run worker

# Terminal 2: Backend
npm run dev

# Terminal 3: Frontend
cd web && npm install && npm run dev
```

### 5. Smoke Test (PowerShell)
```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:3001/health"

# Criar conta
$body = @{ platform="LINKEDIN"; accountName="Test"; accountType="PROFILE"; accessToken="mock"; externalId="123" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/accounts" -Method POST -Body $body -ContentType "application/json"

# Gerar conteúdo
$body = @{ topic="Marketing"; platform="LINKEDIN" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/content/generate" -Method POST -Body $body -ContentType "application/json"

# Criar post
$body = @{ socialAccountId="<ID>"; content="Teste"; contentType="TEXT" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3001/api/posts" -Method POST -Body $body -ContentType "application/json"
```

---

## Bloqueio Atual

**Aguardando:** Criação da conta Upstash Redis

**Tempo estimado para concluir:** 20 minutos após ter Upstash

---

## Checklist Smoke Test (Pendente)

| # | Teste | Status |
|---|-------|--------|
| 1 | Neon configurado | ✅ OK |
| 2 | Upstash criado | ⏳ Pendente |
| 3 | .env configurado | ⏳ Pendente |
| 4 | npm install | ⏳ Pendente |
| 5 | Prisma migrate | ⏳ Pendente |
| 6 | Worker inicia | ⏳ Pendente |
| 7 | Backend inicia | ⏳ Pendente |
| 8 | Frontend inicia | ⏳ Pendente |
| 9 | Health check | ⏳ Pendente |
| 10 | Criar conta | ⏳ Pendente |
| 11 | Gerar conteúdo | ⏳ Pendente |
| 12 | Criar rascunho | ⏳ Pendente |
| 13 | Agendar post | ⏳ Pendente |
| 14 | Publicar texto | ⏳ Pendente |

---

## Notas

- Neon já está configurado e pronto
- Código do mktmanager-v2 está completo
- Apenas falta infraestrutura Redis para executar smoke test
- Arquivo .env precisa ser criado manualmente (bloqueado por segurança)