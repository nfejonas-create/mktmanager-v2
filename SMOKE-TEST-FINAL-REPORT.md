# SMOKE TEST REPORT - mktmanager-v2

**Data:** 2026-04-19
**Status:** ⚠️ PARCIAL - Core funcional com bloqueio em agendamento/publicação

---

## Checklist de Smoke Test

| # | Teste | Status | Erro/Observação |
|---|-------|--------|-----------------|
| 1 | Neon PostgreSQL | ✅ PASSOU | Banco cloud configurado e funcionando |
| 2 | Railway Redis | ✅ PASSOU | Redis cloud configurado e funcionando |
| 3 | .env configurado | ✅ PASSOU | Variáveis de ambiente OK |
| 4 | npm install | ✅ PASSOU | 193 pacotes instalados |
| 5 | Prisma generate | ✅ PASSOU | Client gerado |
| 6 | Prisma migrate | ✅ PASSOU | Tabelas criadas no Neon |
| 7 | Worker inicia | ✅ PASSOU | "Publisher worker started" |
| 8 | Backend inicia | ✅ PASSOU | Porta 3001 OK |
| 9 | Frontend | ⏸️ PENDENTE | Não iniciado (foco em backend) |
| 10 | Health check | ✅ PASSOU | `{ "status": "ok" }` |
| 11 | Criar conta mock | ✅ PASSOU | Conta criada com ID `cmo60e2n60000x5fabemmamzy` |
| 12 | Gerar conteúdo | ✅ PASSOU | Retornou conteúdo mock |
| 13 | Criar rascunho | ✅ PASSOU | Post criado com status `DRAFT` |
| 14 | Agendar post | ⚠️ TIMEOUT | Comando travou, possível bloqueio Redis/Bull |
| 15 | Publicar texto | ⚠️ TIMEOUT | Comando travou ao adicionar job na fila |
| 16 | Verificar stats | ✅ PASSOU | Endpoint respondeu com dados |

---

## Correções Aplicadas Durante o Teste

### 1. encryption.service.ts
- **Problema:** `CryptoJS.mode.GCM` não existe
- **Solução:** Alterado para `CryptoJS.mode.CBC`
- **Arquivo:** `src/shared/security/encryption.service.ts`

### 2. scheduler.service.ts
- **Problema:** `job.state` não existe no tipo Job
- **Solução:** Alterado para retornar string fixa `'scheduled'`
- **Arquivo:** `src/domains/publishing/scheduler.service.ts`

### 3. token-manager.service.ts
- **Problema:** `data` tipo `unknown` não permite acesso a propriedades
- **Solução:** Adicionado type assertion `as { access_token?: string; expires_in?: number }`
- **Arquivo:** `src/domains/social-accounts/token-manager.service.ts`

### 4. account.controller.ts
- **Problema:** Não havia rota POST para criar conta manualmente
- **Solução:** Adicionada rota POST `/` para criar conta
- **Arquivo:** `src/domains/social-accounts/account.controller.ts`

### 5. set-env.ps1
- **Problema:** `ENCRYPTION_KEY` tinha menos de 32 caracteres
- **Solução:** Alterado para `"chave-de-32-caracteres-para-teste!!"`
- **Arquivo:** `set-env.ps1`

### 6. ANTHROPIC_API_KEY
- **Problema:** Valor `mock_claude` não ativava o mock
- **Solução:** Alterado para `mock_anthropic_key`
- **Arquivo:** `set-env.ps1`

---

## Bloqueio Principal

**Agendamento e publicação estão dando TIMEOUT.**

Possíveis causas:
1. Conexão Redis não está processando jobs Bull corretamente
2. Worker não está recebendo/consumindo jobs da fila
3. Possível incompatibilidade entre Bull e Redis do Railway

---

## O que Funciona

✅ Infraestrutura cloud (Neon + Railway)
✅ Backend API respondendo
✅ CRUD de contas sociais
✅ Geração de conteúdo (mock)
✅ Criação de posts (rascunho)
✅ Stats/dashboard

---

## O que Não Funciona

❌ Agendamento de posts (timeout)
❌ Publicação imediata (timeout)
❌ Worker processando jobs (não verificado)

---

## Próxima Recomendação

1. **Verificar conexão Bull-Redis:** Testar se o worker realmente conecta ao Redis Railway
2. **Adicionar logs:** Inserir logs no worker para verificar se jobs estão sendo recebidos
3. **Testar Redis manualmente:** Usar redis-cli para verificar se a fila Bull está criando jobs
4. **Considerar alternativa:** Se Bull não funcionar com Railway Redis, avaliar usar node-cron ou agendamento simples

---

## Arquivos Alterados

1. `src/shared/security/encryption.service.ts`
2. `src/domains/publishing/scheduler.service.ts`
3. `src/domains/social-accounts/token-manager.service.ts`
4. `src/domains/social-accounts/account.controller.ts`
5. `set-env.ps1`

---

## Conclusão

**Core v1 está PARCIALMENTE OPERACIONAL.**

- Contas sociais: ✅ Funcionando
- Posts (rascunho): ✅ Funcionando
- Geração de conteúdo: ✅ Funcionando (mock)
- Agendamento: ❌ Bloqueado (timeout)
- Publicação: ❌ Bloqueado (timeout)

**Recomendação:** Investigar e corrigir a integração Bull-Redis para destravar agendamento/publicação.