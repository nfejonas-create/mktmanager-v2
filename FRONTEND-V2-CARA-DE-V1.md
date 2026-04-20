# FASE 0.7 — V2 COM CARA DE V1 (REWRITE FRONTEND + ENDPOINTS MANUAIS)

**Objetivo:** v2 visualmente igual v1, mas mantendo multi-user já implementado.
**Branch:** `feat/v2-cara-de-v1`
**Escopo:** 4 mudanças cirúrgicas — sem reescrever o que já funciona.

---

## 🎯 O QUE MUDA (resumo)

1. **Configurações** → colar token manualmente (LinkedIn + Facebook), sem OAuth
2. **Configurações** → bloco "Instruções para a IA Geradora" (ler salvas + editar + substituir)
3. **Conteúdo** → gerar por **plataforma** (LinkedIn/Facebook), não por conta
4. **Dashboard** → métricas reais do LinkedIn + gráfico 14 dias

---

# 🔧 PROMPT PARA CODEX

```
Contexto: Repo mktmanager-v2. Branch atual: main. Preciso rewrite cirúrgico
do frontend v2 para ficar igual v1 visualmente, mantendo o backend multi-user
já implementado na Fase 0.

NÃO reescreva arquivos que não listei. NÃO mexa em auth/JWT/encryption.

═══════════════════════════════════════════════════════════
PARTE 1 — BACKEND (3 endpoints novos)
═══════════════════════════════════════════════════════════

1.1) src/domains/social-accounts/account.controller.ts
     Adicionar endpoint:

     PUT /api/accounts/manual
     Body: { platform: 'linkedin'|'facebook', accessToken: string,
             externalId: string, displayName: string }
     - Valida userId pelo JWT (req.user.id)
     - Criptografa accessToken com encryption.service (AES-256-GCM)
     - Upsert em SocialAccount por (userId, platform, externalId)
     - Retorna { id, platform, displayName, externalId, connectedAt }

1.2) src/domains/social-accounts/account.routes.ts
     Registrar rota acima com authMiddleware.

1.3) src/domains/metrics/linkedin-metrics.service.ts (CRIAR)
     - Função fetchLinkedInMetrics(userId, socialAccountId)
     - Busca SocialAccount, descriptografa token
     - Chama LinkedIn API:
       GET https://api.linkedin.com/rest/organizationalEntityFollowerStatistics
       GET https://api.linkedin.com/rest/organizationalEntityShareStatistics
     - Normaliza em: { followers, impressions, engagement, reach, dailyStats: [{date, impressions, engagement}] }
     - Persiste em AccountMetric (14 dias de histórico)
     - Retorna dados normalizados

1.4) src/domains/metrics/metrics.controller.ts
     Endpoint: GET /api/metrics/linkedin/:accountId
     - Valida ownership (accountId pertence a req.user.id)
     - Chama linkedin-metrics.service
     - Retorna { current, chart14d }

═══════════════════════════════════════════════════════════
PARTE 2 — FRONTEND (4 páginas)
═══════════════════════════════════════════════════════════

2.1) web/src/pages/Configuracoes.tsx (REESCREVER COMPLETO)

     Layout minimalista, 3 blocos verticais:

     BLOCO 1 — "Conectar LinkedIn"
     Form com 3 inputs:
       - Access Token (password)
       - Member ID (numérico, ex: 123456789)
       - Nome para exibição
     Botão: "Salvar LinkedIn"
     → PUT /api/accounts/manual { platform:'linkedin', ... }
     Se já conectado, mostra card: "✓ Conectado como [Nome]" + botão Desconectar.

     BLOCO 2 — "Conectar Facebook"
     Form com 3 inputs:
       - Page Access Token (password)
       - Page ID
       - Nome da Página
     Botão: "Salvar Facebook"
     → PUT /api/accounts/manual { platform:'facebook', ... }

     BLOCO 3 — "Instruções para a IA Geradora"
     - Área read-only mostrando promptTemplate atual (GET /api/automation)
       Fundo slate-800, texto slate-300, rotulada "Instruções salvas:"
     - Textarea editável abaixo, 8 linhas, placeholder "Cole novas instruções aqui..."
     - Botão "Substituir Instruções"
       → PUT /api/automation { promptTemplate: novoTexto }
     - Após salvar, recarrega read-only com novo valor.

2.2) web/src/pages/Conteudo.tsx (REESCREVER)

     Abas no topo: [Gerar] [Pendentes] [Aprovados] [Publicados]

     Aba Gerar:
       - Seletor de PLATAFORMA (radio/toggle): ◉ LinkedIn  ○ Facebook
       - Input "Tópico/Contexto" (textarea 4 linhas)
       - Input "Quantidade" (number, default 3)
       - Botão "Gerar com IA"
       → POST /api/content/generate { platform, topic, quantity }
       Backend usa automationConfig.promptTemplate do user + platform
       para gerar variações apropriadas.

     Abas Pendentes/Aprovados/Publicados: lista de posts filtrada por status,
     com ações (aprovar, rejeitar, editar, agendar).

2.3) web/src/pages/Dashboard.tsx (REESCREVER)

     Topo: título + botão "Sincronizar Métricas"
       → POST /api/metrics/linkedin/:accountId/sync

     4 MetricCards (grid 4 cols):
       - Seguidores
       - Impressões (30d)
       - Engajamento (30d)
       - Alcance (30d)
     Dados de: GET /api/metrics/linkedin/:accountId → current

     Gráfico 14 dias (Recharts LineChart):
       - X: data
       - Y: impressions, engagement (2 linhas)
     Dados de: chart14d

     Se não houver conta LinkedIn: mostrar CTA "Conecte sua conta LinkedIn em Configurações".

2.4) web/src/components/MetricCard.tsx (criar se não existir)
     Card com: ícone, label, valor grande, variação %.

═══════════════════════════════════════════════════════════
PARTE 3 — TESTES + COMMIT
═══════════════════════════════════════════════════════════

3.1) Rodar: npm run build (web) + npm run build (backend) → zero erros
3.2) Testar local:
     - Login
     - Configurações: colar token LinkedIn teste → salva
     - Conteúdo: gerar 3 posts LinkedIn → aparece em Pendentes
     - Dashboard: botão Sincronizar → carrega métricas

3.3) Commit:
     git add -A
     git commit -m "feat: v2 frontend com cara de v1 — token manual, IA instruções, platform-first, métricas reais"
     git push origin feat/v2-cara-de-v1

3.4) Abrir PR para main descrevendo as 4 mudanças.

NÃO FAÇA:
- Não remova autenticação JWT
- Não mexa em encryption.service
- Não altere schema do User/AutomationConfig
- Não quebre as rotas existentes de OAuth (deixe dormindo por enquanto)
```

---

# 🚀 PROMPT PARA VERDENT

```
Após o PR da branch feat/v2-cara-de-v1 ser mergeado em main:

1) Backend (Render):
   - Trigger manual deploy no serviço mktmanager-v2-api
   - Verificar logs: "✓ Server listening on :3000"
   - Smoke test: curl PUT /api/accounts/manual com token mock → 401 sem JWT
   - Smoke test: curl GET /api/metrics/linkedin/:id → 401 sem JWT

2) Frontend (Vercel):
   - Auto-deploy deve disparar pelo push em main
   - Confirmar deploy em https://frontend-six-lemon-74.vercel.app
   - Verificar se /configuracoes mostra os 3 blocos novos
   - Verificar se /conteudo tem seletor de plataforma
   - Verificar se /dashboard tem MetricCards + gráfico

3) Validação final com user real:
   - Criar conta nova
   - Colar token LinkedIn real em Configurações
   - Gerar 1 post LinkedIn
   - Sincronizar métricas Dashboard
   - Confirmar gráfico 14d aparece

Se algo falhar, reverter deploy e reportar.
```

---

# 📋 CHECKLIST DE ACEITAÇÃO

- [ ] Configurações tem 3 blocos (LinkedIn / Facebook / IA)
- [ ] Tokens são colados manualmente (não OAuth)
- [ ] IA Instruções: read-only + textarea + botão substituir
- [ ] Conteúdo: seletor platform primeiro (não conta)
- [ ] Dashboard: 4 MetricCards + gráfico 14d reais
- [ ] Build zero erros
- [ ] Deploy backend + frontend OK
- [ ] Smoke test multi-user isolado (usuário A não vê token de B)

**Próximo passo:** Copiar o PROMPT PARA CODEX e colar no Codex. Quando PR estiver aberto, copiar PROMPT PARA VERDENT.
