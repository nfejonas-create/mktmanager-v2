# Mapeamento: Frontend v1 → v2

## 📊 Análise Comparativa

### v1 (MktManager Original)
- **Layout:** Sidebar escura (w-64) + conteúdo principal
- **Tema:** Dark mode (bg-gray-950, bg-gray-900)
- **Menu lateral completo:** Dashboard, Conteúdo, Base Conhecimento, Funil, Calendário, Configurações
- **Header:** Logo + versão do sistema
- **Footer sidebar:** Horários (UTC/BRT), usuário logado, botão sair
- **Telas ricas:** Múltiplas abas, formulários complexos, gráficos

### v2 Atual (Simplificado - REJEITADO)
- **Layout:** Header superior + conteúdo centralizado
- **Tema:** Light mode (bg-gray-50)
- **Menu superior simplificado:** Dashboard, Novo Post, Contas
- **Telas básicas:** Poucas funcionalidades, interface minimalista

---

## 📋 Telas/Componentes da v1 para Replicar

### 1. Estrutura Base
| Componente v1 | Arquivo v1 | Status v2 | Ação |
|---------------|------------|-----------|------|
| Layout com Sidebar | `Layout.tsx` | ❌ Não existe | **Criar** |
| Sidebar completa | `Sidebar.tsx` | ❌ Header apenas | **Criar** |
| AuthContext | `AuthContext.tsx` | ❌ Não existe | **Criar** |
| ErrorBoundary | `App.tsx` | ❌ Não existe | **Criar** |
| Tema dark global | `index.css` | ❌ Light mode | **Alterar** |

### 2. Páginas/Routes
| Rota v1 | Página v1 | Status v2 | Ação |
|---------|-----------|-----------|------|
| `/login` | `Login.tsx` | ❌ Não existe | **Criar** |
| `/dashboard` | `Dashboard.tsx` | ✅ Existe (simplificado) | **Refazer** |
| `/conteudo` | `Conteudo.tsx` | ❌ `CreatePost.tsx` (básico) | **Refazer** |
| `/base-conhecimento` | `BaseConhecimento.tsx` | ❌ Não existe | **Criar** |
| `/funil` | `Funil.tsx` | ❌ Não existe | **Criar** |
| `/calendario` | `Calendario.tsx` | ❌ Não existe | **Criar** |
| `/configuracoes` | `Configuracoes.tsx` | ❌ Não existe | **Criar** |
| `/auth/callback` | `AuthCallback.tsx` | ❌ Não existe | **Criar** |

### 3. Componentes Reutilizáveis
| Componente v1 | Arquivo v1 | Status v2 | Ação |
|---------------|------------|-----------|------|
| MetricCard | `MetricCard.tsx` | ❌ Não existe | **Criar** |
| Gráficos (recharts) | `Dashboard.tsx` | ❌ Não existe | **Criar** |
| PublishModal | `Conteudo.tsx` | ❌ Não existe | **Criar** |
| Tabs de conteúdo | `Conteudo.tsx` | ❌ Não existe | **Criar** |

---

## ✅ O que Reaproveitar do v2 Atual

### API/Integração
| Item | Status | Notas |
|------|--------|-------|
| `api.ts` (axios) | ✅ Reaproveitar | Adicionar suporte a `import.meta.env` |
| Tipos TypeScript | ✅ Reaproveitar | Interfaces de Post, Account, etc. |
| Hooks de estado | ✅ Reaproveitar | useState, useEffect padrões |

### Páginas Base (para expandir)
| Página v2 | Base para v1 | Notas |
|-----------|--------------|-------|
| `Dashboard.tsx` | Estrutura mínima | Adicionar gráficos, métricas, cards |
| `CreatePost.tsx` | Formulário base | Expandir para abas (gerar/upload/analyze/posts) |
| `SocialAccounts.tsx` | Lista base | Adicionar OAuth, perfis, múltiplas contas |
| `PostDetails.tsx` | Detalhes base | Manter, integrar no fluxo |

---

## 🔧 O que Precisa Ser Refeito

### Prioridade 1 - Estrutura Base
1. **Criar `Layout.tsx`** com sidebar escura
2. **Criar `Sidebar.tsx`** com menu completo da v1
3. **Criar `AuthContext.tsx`** para autenticação
4. **Alterar tema** para dark mode global
5. **Atualizar `App.tsx`** com rotas aninhadas e ErrorBoundary

### Prioridade 2 - Páginas Principais
1. **`Dashboard.tsx`** - Com gráficos recharts, métricas, cards
2. **`Conteudo.tsx`** - Com abas (Gerar Post, Upload, Analisar, Histórico)
3. **`BaseConhecimento.tsx`** - Tela de base de conhecimento
4. **`Funil.tsx`** - Tela de funil de vendas
5. **`Calendario.tsx`** - Tela de calendário
6. **`Configuracoes.tsx`** - Tela de configurações
7. **`Login.tsx`** - Tela de login

### Prioridade 3 - Componentes
1. **`MetricCard.tsx`** - Cards de métricas
2. **Gráficos** - LineChart, etc. com recharts
3. **Modais** - PublishModal, etc.

---

## 🎨 Especificações Visuais da v1

### Cores (Tailwind)
```
Fundo principal: bg-gray-950
Sidebar: bg-gray-900
Bordas: border-gray-800
Texto principal: text-white
Texto secundário: text-gray-400
Texto terciário: text-gray-500
Ativo/Primário: bg-blue-600, text-blue-500
Sucesso: text-green-400, bg-green-900/20
Alerta: text-yellow-400, bg-yellow-900/20
```

### Layout
```
App: flex h-screen bg-gray-950
Sidebar: w-64 bg-gray-900 border-r border-gray-800
Main: flex-1 overflow-y-auto p-6
```

### Tipografia
```
Título página: text-2xl font-bold text-white
Subtítulo: text-gray-400 text-sm
Links menu: text-sm
```

---

## 🔄 Fluxo de Navegação v1

```
Login → Layout (Sidebar) → Dashboard (default)
                    ↓
        ┌───────────┼───────────┬───────────┬───────────┐
        ↓           ↓           ↓           ↓           ↓
    Dashboard   Conteúdo   Base Conhec.  Funil    Calendário   Configurações
                   ↓
        ┌──────────┼──────────┬──────────┐
        ↓          ↓          ↓          ↓
    Gerar Post  Upload    Analisar   Histórico
```

---

## 📝 Checklist de Implementação

### Fase 1: Estrutura Base
- [ ] Criar `Layout.tsx`
- [ ] Criar `Sidebar.tsx` com menu completo
- [ ] Criar `AuthContext.tsx`
- [ ] Atualizar `App.tsx` com rotas aninhadas
- [ ] Configurar tema dark global
- [ ] Adicionar ErrorBoundary

### Fase 2: Páginas
- [ ] Refazer `Dashboard.tsx` (com gráficos)
- [ ] Refazer `Conteudo.tsx` (com abas)
- [ ] Criar `BaseConhecimento.tsx`
- [ ] Criar `Funil.tsx`
- [ ] Criar `Calendario.tsx`
- [ ] Criar `Configuracoes.tsx`
- [ ] Criar `Login.tsx`

### Fase 3: Componentes
- [ ] Criar `MetricCard.tsx`
- [ ] Configurar recharts
- [ ] Criar modais (PublishModal)

### Fase 4: Integração
- [ ] Conectar com API v2
- [ ] Testar múltiplas contas
- [ ] Validar fluxo completo

---

## 🎯 Principais Diferenças Funcionais (v2 vs v1)

| Aspecto | v1 | v2 (Manter) |
|---------|-----|-------------|
| Contas | Única por plataforma | ✅ Múltiplas contas |
| Scheduler | Próprio (problemático) | ✅ node-cron + Redis |
| Publicação | Básica | ✅ Robusta (2 tentativas) |
| Banco | Local/SQLite | ✅ Neon PostgreSQL |
| Estrutura | Monolítica | ✅ Modular |

---

## 📁 Arquivos a Criar/Modificar

### Novos Arquivos
```
web/src/components/Layout.tsx
web/src/components/Sidebar.tsx
web/src/components/MetricCard.tsx
web/src/contexts/AuthContext.tsx
web/src/pages/Login.tsx
web/src/pages/BaseConhecimento.tsx
web/src/pages/Funil.tsx
web/src/pages/Calendario.tsx
web/src/pages/Configuracoes.tsx
web/src/pages/AuthCallback.tsx
```

### Arquivos a Modificar
```
web/src/App.tsx (reestruturar)
web/src/index.css (tema dark)
web/src/pages/Dashboard.tsx (refazer)
web/src/pages/CreatePost.tsx → Conteudo.tsx
web/src/pages/SocialAccounts.tsx (integrar)
```

---

**Resumo:** Replicar visual e fluxo da v1, mantendo melhorias estruturais da v2 (múltiplas contas, scheduler robusto, publicação melhorada).
