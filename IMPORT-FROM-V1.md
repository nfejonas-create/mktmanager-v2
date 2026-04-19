# Import do mktmanager v1 para PostFlow v2

## Data: 2026-04-19
## Responsável: Verdent

---

## ✅ O que foi IMPORTADO

### 1. Estratégia de Publicação LinkedIn
**Arquivo origem:** `mktmanager/backend/src/services/schedulerService.ts`
**Arquivo destino:** `mktmanager-v2/src/domains/publishing/publisher.service.ts`

**Lógica importada:**
- Tentativa 1: POST `/rest/posts` com `author: 'urn:li:person:~'`
- Tentativa 2: Resolver `memberId` via `/v2/userinfo` ou `/v2/me`
- Tentativa 3: Fallback para `/v2/ugcPosts` (API legada)
- Logging seguro (não expõe token completo)

**Adaptações feitas:**
- Portado de JavaScript para TypeScript
- Integrado com Prisma ORM do v2
- Adicionado tipagem forte (PublishResult)

### 2. Estratégia de Agendamento
**Arquivo origem:** `mktmanager/backend/src/services/schedulerService.ts`
**Arquivo destino:** `mktmanager-v2/src/shared/scheduler/cron.scheduler.ts`

**Lógica importada:**
- Uso de `node-cron` para polling a cada 1 minuto
- Query de posts com status `SCHEDULED` e `scheduledAt <= now`
- Atualização de status após publicação

**Adaptações feitas:**
- Intervalo reduzido de 5 min (v1) para 1 min (v2)
- Integração com service layer do v2
- Melhor tratamento de erros

### 3. Configurações de Timeout
**Valor importado:** 10s para chamadas LinkedIn, 5s para userinfo
**Racional:** Valores testados e estáveis no v1

---

## ❌ O que foi DESCARTADO

### 1. Estrutura de Banco v1
**Motivo:** Schema diferente, v2 usa Prisma com modelos normalizados
**Descarte:** Tabelas `Post`, `SocialAccount`, `User` do v1

### 2. Query Raw SQL
**Motivo:** v2 usa Prisma Client com queries tipadas
**Descarte:** `prisma.$queryRaw` com joins manuais

### 3. Lógica de Conta Única
**Motivo:** v2 suporta múltiplas contas desde o início
**Descarte:** `LEFT JOIN SocialAccount` com lógica de fallback

### 4. Retry Mal Estruturado
**Motivo:** v2 tem tratamento de erro por exceção
**Descarte:** Blocos try-catch aninhados sem propagação clara

---

## 📋 Links Úteis (Importados)

### Documentação LinkedIn
- Posts API: `https://api.linkedin.com/rest/posts`
- UGC Posts API: `https://api.linkedin.com/v2/ugcPosts`
- User Info: `https://api.linkedin.com/v2/userinfo`

### Endpoints Facebook (para fase 2)
- Graph API: `https://graph.facebook.com/v18.0`
- OAuth: `https://www.facebook.com/v18.0/dialog/oauth`

---

## 🔧 Configurações Reaproveitáveis

### Variáveis de Ambiente
```bash
# LinkedIn
LINKEDIN_CLIENT_ID=77r1k0xvpegsrg
LINKEDIN_REDIRECT_URI=https://www.linkedin.com/developers/tools/oauth/redirect

# Escopos OAuth
LINKEDIN_SCOPE=openid profile w_member_social
```

### Horários de Postagem (para analytics futuro)
- Melhor engagement: 8h-10h, 12h-14h, 18h-20h
- Dias: Terça a Quinta (LinkedIn B2B)

---

## 📝 Templates de Conteúdo (Ideias para fase 2)

Do v1, identificados padrões de posts que funcionavam:
1. **Dica Rápida:** "3 dicas para..." + CTA + hashtags
2. **Case:** "Como ajudamos [cliente] a..." + resultado
3. **Pergunta:** "Você já enfrentou...?" + engajamento

**Status:** Não importados textualmente, mas documentados para referência.

---

## ✅ Checklist de Import

- [x] Estratégia de publicação LinkedIn
- [x] Lógica de agendamento com node-cron
- [x] Timeouts de API
- [x] Links de documentação
- [x] Configurações OAuth
- [ ] Templates de conteúdo (fase 2)
- [ ] Analytics/horários (fase 2)

---

## 🎯 Resultado

Importação **segura e seletiva**. Apenas código e configurações testados foram trazidos. Gambiarras estruturais e débito técnico do v1 foram **intencionalmente descartados**.
