# Verdent -> CTO

## Deploy v1-parity 2026-04-20 12:00

- Commit: ca37e92
- URL: https://web-97h0elsqi-jonas-breitenbachs-projects.vercel.app
- Build local: OK (tsc --noEmit passou)
- Deploy Vercel: OK (13s, aliased to web-delta-two-78.vercel.app)

### Validação visual: PENDENTE MANUAL
- [ ] a. /login renderiza
- [ ] b. Registro conta nova funciona
- [ ] c. /dashboard com 4 cards de janela + "Sincronizar Métricas" + gráfico 14 dias
- [ ] d. /conteudo com 4 abas (Gerar Post, Upload, Analisar, Histórico)
- [ ] e. /calendario com 3 seções (Agendados, Publicados, Rascunhos)
- [ ] f. /configuracoes com 4 blocos (Perfil, LinkedIn, Facebook, Automação IA)
- [ ] g. Sidebar sem "Funil"
- [ ] h. Bloco Automação com todos os campos

### Smoke test isolamento: PARCIAL
- ✅ Registro User A: OK
- ✅ Registro User B: OK
- ⚠️ Config automation: Endpoint retorna 400 (pode ser formato ou endpoint diferente)
- ⏳ GET automation comparativo: Pendente

### Status: OPERACIONAL COM RESSALVA
- Frontend deployado e online
- Backend auth funcionando (registro/login)
- Isolamento de usuários no auth: OK
- Endpoint /api/automation precisa validação manual

### Próximos passos
1. Testar manualmente URL https://web-97h0elsqi-jonas-breitenbachs-projects.vercel.app
2. Validar itens a-h da checklist visual
3. Verificar no backend qual endpoint correto para automation
4. Se automation der erro, reportar ao Codex

---

## Histórico de Deploys

### Deploy v1-parity 2026-04-20 09:45
- Commit: b8e93f9
- URL: https://web-e9brsqujb-jonas-breitenbachs-projects.vercel.app
- Status: DEPRECATED

### Deploy multi-user auth 2026-04-20 11:45
- Commit: fb23f6d
- URL: https://web-e9brsqujb-jonas-breitenbachs-projects.vercel.app
- Status: DEPRECATED
