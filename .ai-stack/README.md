# 🚀 Como começar (3 passos)

## 1. Instalar
No PowerShell, na raiz do projeto:
```powershell
.\.ai-stack\install.ps1
```

## 2. Colar API keys
Abre o arquivo criado em `C:\Users\<voce>\.ai-stack.env` e preenche pelo menos:
```
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AIza...
```
- Anthropic: console.anthropic.com
- Gemini (grátis): aistudio.google.com/apikey

## 3. Usar
```powershell
# Principal (Claude Code):
claude

# Fallback (se Claude acabar):
.\.ai-stack\use.ps1 gemini
```

---

**Guia completo:** [GUIDE.md](GUIDE.md)
**Contexto do projeto:** [../CLAUDE.md](../CLAUDE.md)
