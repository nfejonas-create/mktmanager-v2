# 🚀 POSTFLOW - RESUMO COMPLETO PARA NOVA CONVERSA

## 📍 Caminho do Projeto
```
C:\Users\HP\.verdent\verdent-projects\consegue-acessar-meus-projetos\mktmanager-v2
```

## 🔗 URLs de Produção (ATIVAS)

| Serviço | URL | Status |
|---------|-----|--------|
| **Frontend** | https://web-97h0elsqi-jonas-breitenbachs-projects.vercel.app | ✅ Online |
| **Backend** | https://postflow-backend-cspj.onrender.com | ✅ Online |
| **Health** | https://postflow-backend-cspj.onrender.com/health | ✅ 200 |
| **GitHub** | https://github.com/nfejonas-create/mktmanager-v2 | ✅ Main branch |

## 📁 Estrutura de Pastas

```
mktmanager-v2/
├── 📁 src/                          # Backend Node.js
│   ├── 📁 api/
│   ├── 📁 domains/
│   │   ├── 📁 auth/                 # Auth controller
│   │   ├── 📁 publishing/           # Posts + scheduler
│   │   └── 📁 social-accounts/      # LinkedIn/Facebook OAuth
│   ├── 📁 shared/
│   │   ├── 📁 database/
│   │   ├── 📁 security/             # JWT + Encryption
│   │   └── 📁 scheduler/
│   └── 📁 workers/
├── 📁 web/                          # Frontend React
│   ├── 📁 src/
│   │   ├── 📁 pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Conteudo.tsx
│   │   │   ├── Contas.tsx
│   │   │   ├── Calendario.tsx
│   │   │   └── Configuracoes.tsx
│   │   ├── 📁 contexts/             # AuthContext
│   │   └── 📁 components/
│   └── package.json
├── 📁 prisma/                       # Schema + migrations
├── render.yaml                      # Config Render
└── vercel.json                      # Config Vercel
```

## 🔐 Credenciais de Teste

**Usuário configurado:**
- Email: `nfe.jonas@gmail.com`
- Senha: `203015`

**Ou criar novo:**
```bash
curl -X POST https://postflow-backend-cspj.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@email.com","password":"123456"}'
```

## 🛠️ Comandos Úteis

### Deploy Frontend
```bash
cd C:\Users\HP\.verdent\verdent-projects\consegue-acessar-meus-projetos\mktmanager-v2\web
npx vercel --prod
```

### Deploy Backend
Via Render Dashboard: https://dashboard.render.com/blueprints

### Build Local
```bash
# Backend
cd mktmanager-v2
npm ci && npm run build

# Frontend
cd mktmanager-v2/web
npm ci && npm run build
```

## ✅ Funcionalidades Implementadas

- ✅ Auth real (JWT)
- ✅ Multi-usuário (Jonas/Niulane)
- ✅ Dashboard com métricas
- ✅ Conteúdo (gerar/agendar posts)
- ✅ Contas (LinkedIn/Facebook)
- ✅ Calendário
- ✅ Configurações
- ❌ Upload de imagem real (fase 2)
- ❌ Funil (removido)

## 📝 Arquivos de Documentação

- `PROJETO-COMPLETO-GUIDE.md` - Estrutura completa
- `verdent-to-cto.md` - Histórico de deploys
- `FRONTEND-REFACTOR-MAP.md` - Mapeamento v1→v2

## 🎯 Próximo Objetivo (Sugerido)

1. Testar fluxo completo no frontend
2. Validar geração de post com LinkedIn
3. Corrigir bugs visuais se houver
4. Implementar upload de imagem (fase 2)

---

**Último commit:** ca37e92 - "chore: enable vercel auto-deploy from main"
**Branch atual:** main
**Status:** Operacional ✅
