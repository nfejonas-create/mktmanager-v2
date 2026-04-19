# 🚀 PostFlow - Status de Acesso

## ✅ FRONTEND DEPLOYADO

**URL:** https://web-bjjubv3pu-jonas-breitenbachs-projects.vercel.app

**Status:** Online, mas retornando 401 porque o backend não está acessível

---

## ❌ PROBLEMA: Backend Local vs Frontend Online

O frontend deployado no Vercel está tentando acessar:
- `http://localhost:3001/api` (não acessível da internet)

Mas o backend está rodando apenas no seu PC local.

---

## 🔧 SOLUÇÕES

### Opção 1: Expor Backend via ngrok (Rápido - 2 minutos)

```bash
# 1. Instalar ngrok
npm install -g ngrok

# 2. Configurar autenticação (crie conta em ngrok.com)
ngrok config add-authtoken SEU_TOKEN_AQUI

# 3. Expor o backend
ngrok http 3001

# 4. O ngrok mostrará uma URL pública tipo:
# https://abc123.ngrok.io

# 5. Atualizar frontend com nova URL do backend
# (precisa redeployar o frontend)
```

### Opção 2: Deploy Backend no Render (Permanente - 15 minutos)

1. Acesse: https://dashboard.render.com
2. "New +" → "Blueprint"
3. Conecte seu repositório GitHub
4. Selecione `render.yaml`
5. Configure variáveis de ambiente:
   - DATABASE_URL
   - REDIS_URL
   - ENCRYPTION_KEY
   - LINKEDIN_CLIENT_ID
   - LINKEDIN_CLIENT_SECRET
6. Deploy

### Opção 3: Acesso Local (Funciona Agora)

Acesse pelo PC:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## 📱 Para Acessar pelo Celular

**Mesma Rede WiFi:**
```
1. PC e celular na mesma rede
2. Descubra IP do PC: ipconfig
3. No celular: http://[IP_DO_PC]:5173
```

**Com Backend Online:**
```
1. Deploy backend no Render
2. Atualizar VITE_API_URL no Vercel
3. Acessar: https://web-bjjubv3pu-jonas-breitenbachs-projects.vercel.app
```

---

## 🎯 RECOMENDAÇÃO

Para ter acesso **permanente e funcional** no celular:

1. **Deploy backend no Render** (15 minutos)
2. **Atualizar variável no Vercel:**
   - Acesse: https://vercel.com/jonas-breitenbachs-projects/web/settings/environment-variables
   - Adicione: `VITE_API_URL=https://postflow-backend.onrender.com/api`
3. **Redeploy frontend**

---

## 📊 Status Atual

| Componente | Status | Acesso |
|------------|--------|--------|
| Frontend | ✅ Online | https://web-bjjubv3pu-jonas-breitenbachs-projects.vercel.app |
| Backend | ⏳ Local | http://localhost:3001 |
| Banco | ✅ Cloud | Neon PostgreSQL |
| Redis | ✅ Cloud | Railway |

**Próximo passo:** Deploy do backend no Render para URL pública permanente.
