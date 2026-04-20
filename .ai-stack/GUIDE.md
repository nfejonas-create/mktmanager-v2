# AI-STACK — Guia de Uso

Stack multi-LLM para desenvolvimento sem depender de uma única IA. Se acabar crédito do Claude, você troca para Gemini/GPT/local em 1 comando.

---

## 🎯 O que você tem depois de instalado

| Ferramenta | Modelos | Uso |
|---|---|---|
| **Claude Code** | Opus 4.6 / Sonnet 4.6 / Haiku 4.5 | Principal — melhor para código complexo |
| **Aider** | Claude, GPT-5, Gemini 2.5, DeepSeek, Ollama local | Fallback universal — troca de modelo em 1 comando |

---

## 🚀 Comandos rápidos

Dentro da pasta de qualquer projeto com `.ai-stack/`:

```powershell
# Claude Code (padrão, melhor qualidade)
claude

# Dentro do Claude Code, troca modelo:
/model opus
/model sonnet
/model haiku

# Aider com qualquer modelo:
.\.ai-stack\use.ps1 sonnet      # Claude Sonnet
.\.ai-stack\use.ps1 opus        # Claude Opus
.\.ai-stack\use.ps1 gemini      # Gemini 2.5 Pro (tem free tier)
.\.ai-stack\use.ps1 gpt         # GPT-5
.\.ai-stack\use.ps1 deepseek    # DeepSeek (barato)
.\.ai-stack\use.ps1 local       # Ollama local (grátis, offline)
```

---

## 🔑 Onde pegar as API keys

Edite: `C:\Users\<seu-user>\.ai-stack.env`

| Variável | Onde obter | Custo |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com | Pay-per-use |
| `GEMINI_API_KEY` | aistudio.google.com/apikey | **Free tier** generoso |
| `OPENAI_API_KEY` | platform.openai.com/api-keys | Pay-per-use |
| `DEEPSEEK_API_KEY` | platform.deepseek.com | Muito barato |

**Recomendação:** configure pelo menos **Anthropic + Gemini**. Gemini cobre 99% dos fallbacks sem pagar nada.

---

## 🔄 Fluxo típico de trabalho

1. Abre terminal na pasta do projeto
2. Roda `claude` (padrão)
3. Fala o que precisa: *"ajusta o bug X em arquivo Y"*
4. Claude edita, commita, pusha
5. Deploy automático (Render + Vercel)

**Se acabar crédito Claude no meio:**
1. `Ctrl+C` pra sair
2. `.\.ai-stack\use.ps1 gemini`
3. Continua a mesma conversa com Aider+Gemini
4. Aider lê o mesmo `CLAUDE.md` → zero contexto perdido

---

## 📦 Como replicar em novos projetos

**Opção A — Copiar pasta:**
```powershell
# Da raiz do mktmanager-v2:
Copy-Item -Recurse .ai-stack C:\caminho\novo-projeto\
Copy-Item CLAUDE.md C:\caminho\novo-projeto\CLAUDE.md
# Edita o CLAUDE.md novo com o contexto do novo projeto
```

**Opção B — Repo template (recomendado):**
1. Cria repo `ai-stack-template` no GitHub com essa pasta `.ai-stack/` + `CLAUDE.md` em branco
2. Em cada projeto novo:
```powershell
git clone https://github.com/<seu-user>/ai-stack-template temp
Move-Item temp\.ai-stack .
Move-Item temp\CLAUDE.md .
Remove-Item -Recurse temp
```

**Opção C — Globalmente (Aider disponível em qualquer pasta):**
- As API keys em `~\.ai-stack.env` já são globais.
- O script `use.ps1` você pode colocar em qualquer pasta do `$PATH`.

---

## 🧠 Por que `CLAUDE.md` no repo?

É o **cérebro compartilhado** entre as ferramentas. Claude Code lê automático. Aider também (via `.aider.conf.yml` com `read: [CLAUDE.md]`).

Ele guarda:
- Stack do projeto
- Regras de negócio
- Princípios de execução
- Comandos úteis
- Estado atual (fases concluídas / pendentes)

**Atualize o `CLAUDE.md` sempre que mudar arquitetura ou concluir fase.** É o que evita retrabalho.

---

## ⚠️ Regras de ouro

1. **NUNCA commitar `.ai-stack.env`** — já está no gitignore
2. **NUNCA colocar API key dentro do código** — sempre via env var
3. **Sempre rodar `git pull` antes** de abrir Claude Code/Aider
4. **Commitar antes de trocar de ferramenta** — evita conflito

---

## 🆘 Troubleshooting

| Problema | Solução |
|---|---|
| "aider not found" | Reabre PowerShell. Se persistir: `python -m pip install --user aider-chat` |
| "claude not found" | `npm install -g @anthropic-ai/claude-code` |
| API key não carrega | Verifica `~\.ai-stack.env` e reabre PowerShell |
| Gemini "quota exceeded" | Espera 1 min. Free tier = 2 req/min |
| Ollama não responde | Instala: ollama.com/download e `ollama pull deepseek-coder-v2` |
