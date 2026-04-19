# MVP v1 - mktmanager-v2

## Status Real: Base Implementada / Scaffold Funcional

⚠️ **NÃO É MVP COMPLETO** - Sistema em fase de scaffold com funcionalidades core estruturadas, pronto para iterações.

**Local:** `C:\Users\HP\.verdent\verdent-projects\consegue-acessar-meus-projetos\mktmanager-v2`

---

## ✅ PRONTO (Testável / Funcional)

| Funcionalidade | Status | Detalhes |
|----------------|--------|----------|
| Estrutura de pastas | ✅ | Arquitetura limpa, domínios separados |
| Schema Prisma | ✅ | Modelos, índices, constraints corretos |
| Docker Compose | ✅ | Postgres 15 + Redis 7 configurados |
| Encryption Service | ✅ | AES-256-GCM com IV único |
| Social Accounts CRUD | ✅ | Criptografia, múltiplas contas por plataforma |
| Content Templates | ✅ | Mock/templates por plataforma (LinkedIn/Facebook) |
| Dashboard UI | ✅ | 4 telas React funcionais |
| Upload local | ✅ | Salva em /uploads/, serve estático |
| Agendamento Bull | ✅ | schedulePost, reschedulePost, cancelSchedule |
| Publisher Worker | ✅ | Processa fila, atualiza status |

---

## ⚠️ PARCIAL (Funciona com limitações)

| Funcionalidade | Status | Limitação |
|----------------|--------|-----------|
| OAuth LinkedIn | ⚠️ | Estrutura pronta, usa tokens mock em dev |
| OAuth Facebook | ⚠️ | Estrutura pronta, usa tokens mock em dev |
| Publicação texto | ⚠️ | Funciona com mock tokens, não testado com real |
| Metrics sync | ⚠️ | Estrutura pronta, retorna mock em dev |
| Re-agendamento | ⚠️ | Implementado, precisa testar edge cases |

---

## 🔶 MOCK (Simulado / Apenas estrutura)

| Funcionalidade | Status | Observação |
|----------------|--------|------------|
| Claude AI | 🔶 | Retorna templates estáticos, não chama API real |
| LinkedIn OAuth | 🔶 | Gera tokens mock, não redireciona para LinkedIn |
| Facebook OAuth | 🔶 | Gera tokens mock, não redireciona para Facebook |
| Publicação imagem | 🔶 | **NÃO IMPLEMENTADO** - estrutura preparada, falta upload real para APIs |
| Metrics reais | 🔶 | Gera dados aleatórios em dev |

---

## ⏳ PENDENTE (Próxima fase)

| Funcionalidade | Prioridade | Complexidade | Notas |
|----------------|------------|--------------|-------|
| Upload imagem LinkedIn | 🔥 Alta | Alta | Requer asset registration (2-step API) |
| Upload imagem Facebook | 🔥 Alta | Média | Requer URL pública acessível |
| OAuth real LinkedIn | Média | Baixa | Só trocar credenciais no .env |
| OAuth real Facebook | Média | Baixa | Só trocar credenciais no .env |
| Claude API real | Média | Baixa | Só trocar API key no .env |
| Testes end-to-end | Média | Média | Validar fluxo completo |
| Retry com backoff | Baixa | Baixa | Melhorar resiliência |
| Notificações de falha | Baixa | Média | Email/webhook quando post falha |

---

## O que foi corrigido nesta rodada

### ✅ Agendamento Real
- [x] POST /posts chama `schedulePost()` quando há `scheduledAt` e `publishNow` é false
- [x] PUT /posts/:id detecta mudança em `scheduledAt` e chama `reschedulePost()`
- [x] Método `reschedulePost()` implementado (cancela job antigo + cria novo)
- [x] Cancelamento funciona e remove job da fila Bull

### ✅ Documentação
- [x] Status honesto separado em: PRONTO / PARCIAL / MOCK / PENDENTE
- [x] Publicação com imagem marcada claramente como MOCK/PENDENTE

---

## Como testar o agendamento

1. **Iniciar infraestrutura:**
   ```bash
   docker-compose up -d
   ```

2. **Instalar dependências:**
   ```bash
   npm install
   cd web && npm install
   ```

3. **Executar migrations:**
   ```bash
   npm run db:migrate
   ```

4. **Iniciar worker (terminal 1):**
   ```bash
   npm run worker
   ```

5. **Iniciar servidor (terminal 2):**
   ```bash
   npm run dev
   ```

6. **Iniciar frontend (terminal 3):**
   ```bash
   cd web && npm run dev
   ```

7. **Testar fluxo:**
   - Criar conta mock (POST /api/accounts/linkedin/auth simula sucesso)
   - Criar post agendado para 2 minutos no futuro
   - Verificar no Redis/Bull que job foi criado
   - Aguardar execução automática

---

## Arquitetura do Agendamento

```
Criar Post (com scheduledAt)
    ↓
scheduleService.schedulePost(postId, date)
    ↓
Bull Queue (job delayed)
    ↓
Redis persiste job
    ↓
Horário chega → Worker processa
    ↓
PublisherService.publish()
    ↓
API LinkedIn/Facebook
    ↓
Post atualizado: PUBLISHED + externalId
```

---

## Próximos Passos Recomendados

1. **Testar agendamento** com Docker local
2. **Implementar upload de imagem real:**
   - LinkedIn: fluxo de asset registration (upload → register → post)
   - Facebook: upload para CDN ou usar URL pública
3. **Trocar para OAuth real** quando apps estiverem configurados
4. **Deploy em staging** para validação completa

---

## Notas Técnicas

- **mktmanager v1**: Permanece intacto em `consegue-acessar-meus-projetos/mktmanager/`
- **Criptografia**: Tokens são criptografados com AES-256-GCM antes de salvar
- **Isolamento**: Cada post está vinculado a uma SocialAccount específica
- **Fila**: Bull + Redis para agendamento confiável
- **Worker**: Processa jobs em background, atualiza status automaticamente

---

**Data:** 2026-04-15
**Status:** ✅ Base implementada / Agendamento corrigido / Próxima: imagem real