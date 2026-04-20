# mktmanager-v2 (PostFlow)

**Produto:** SaaS de automação de posts em LinkedIn e Facebook com IA geradora. Multi-user (v2 = v1 funcional + isolamento por usuário).

**Stack:**
- Backend: Node.js + TypeScript + Express + Prisma + PostgreSQL + Redis + Bull
- Frontend: React + Vite + Tailwind + Lucide icons
- Auth: JWT + bcrypt
- Cripto tokens: AES-256-GCM (src/shared/security/encryption.service.ts)
- Deploy: Backend no Render, Frontend no Vercel (auto-deploy via push em main)
- Workers: node-cron por usuário + Bull queues

**Estrutura:**
```
mktmanager-v2/
├── src/                    # Backend
│   ├── domains/
│   │   ├── auth/           # JWT + User model
│   │   ├── social-accounts/# SocialAccount + OAuth + manual token
│   │   ├── content/        # Posts + geração IA
│   │   ├── automation/     # AutomationConfig (1:1 User)
│   │   └── metrics/        # LinkedIn/Facebook analytics
│   └── shared/
│       └── security/       # encryption.service.ts (AES-256-GCM)
├── prisma/schema.prisma    # Models: User, SocialAccount, Post, AccountMetric, AutomationConfig
├── web/src/                # Frontend
│   ├── pages/              # Login, Dashboard, Conteudo, Configuracoes, Calendario
│   ├── contexts/AuthContext.tsx
│   └── services/api.ts     # Axios com Bearer JWT
└── .ai-stack/              # Multi-LLM dev stack (NÃO commitar keys)
```

**Regras de negócio:**
- Cada `User` tem N `SocialAccount` (LinkedIn/Facebook) com token criptografado.
- `AutomationConfig` 1:1 com User guarda `promptTemplate` (instruções IA) + `aiApiKey` (OpenAI/Anthropic/Gemini do próprio user).
- Geração é **por plataforma** (LinkedIn/Facebook), não por conta.
- Isolamento: TODA query filtra por `userId = req.user.id`. NUNCA confiar em query string.
- Tokens LinkedIn/Facebook são colados manualmente pelo user em Configurações (sem OAuth — decisão do produto).

**Fases:**
- ✅ Fase 0: Multi-user auth + JWT + User model + AES-256-GCM
- ✅ Fase 0.5: Frontend v1-parity (Dashboard/Conteúdo/Calendário/Configurações estrutura)
- 🔨 Fase 0.7: V2 com cara de v1 (token manual, IA instruções, platform-first, métricas reais)
- ⏳ Fase 1: OAuth state em Redis (opcional, já que v2 usa token manual)
- ⏳ Fase 2: Testes E2E multi-user isolamento

**Princípios de execução:**
1. NUNCA remover auth/JWT/encryption
2. Mudanças cirúrgicas, não reescritas
3. Build zero erros antes de commit
4. Push em branch → PR → merge main → deploy automático
5. Toda feature nova precisa filtrar por `req.user.id`

**Deploy:**
- Push em `main` → Vercel deploy frontend + Render deploy backend (auto)
- Secrets: Render tem `JWT_SECRET`, `ENCRYPTION_KEY`, `DATABASE_URL`, `REDIS_URL`
- Frontend: https://frontend-six-lemon-74.vercel.app

**Comandos úteis:**
```bash
# Dev backend
npm run dev

# Dev frontend
cd web && npm run dev

# Build
npm run build && cd web && npm run build

# Prisma
npx prisma migrate dev
npx prisma studio

# Testes
npm test
```

**Documentos do projeto:**
- `FRONTEND-V2-CARA-DE-V1.md` — Especificação Fase 0.7
- `AUDITORIA-E-PROMPTS.md` — Auditoria inicial
- `PROMPTS-CODEX-VERDENT.md` — Prompts Fase 0 (histórico)
