# AI-STACK INSTALLER (Windows PowerShell)
# Instala: Claude Code + Aider (multi-LLM) + config
# Uso: .\install.ps1

$ErrorActionPreference = "Stop"

Write-Host "=== AI-Stack Installer ===" -ForegroundColor Cyan

# 1. Verifica pré-requisitos
Write-Host "`n[1/5] Verificando pré-requisitos..." -ForegroundColor Yellow

function Test-Command($cmd) {
    try { Get-Command $cmd -ErrorAction Stop | Out-Null; return $true }
    catch { return $false }
}

if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js não encontrado. Instale: https://nodejs.org (LTS)" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Node.js $(node -v)"

if (-not (Test-Command "python")) {
    Write-Host "❌ Python não encontrado. Instale: https://python.org (3.10+)" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Python $(python --version)"

if (-not (Test-Command "git")) {
    Write-Host "❌ Git não encontrado. Instale: https://git-scm.com" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Git $(git --version)"

# 2. Instala Claude Code
Write-Host "`n[2/5] Instalando Claude Code..." -ForegroundColor Yellow
if (Test-Command "claude") {
    Write-Host "  ✓ Já instalado"
} else {
    npm install -g @anthropic-ai/claude-code
    Write-Host "  ✓ Claude Code instalado" -ForegroundColor Green
}

# 3. Instala Aider (multi-LLM fallback)
Write-Host "`n[3/5] Instalando Aider..." -ForegroundColor Yellow
if (Test-Command "aider") {
    Write-Host "  ✓ Já instalado"
} else {
    python -m pip install --user aider-install
    python -m aider_install
    Write-Host "  ✓ Aider instalado" -ForegroundColor Green
}

# 4. Cria arquivo de API keys (se não existir)
Write-Host "`n[4/5] Configurando API keys..." -ForegroundColor Yellow
$envPath = "$HOME\.ai-stack.env"
if (-not (Test-Path $envPath)) {
    @"
# AI-STACK API KEYS — NÃO COMMITAR
# Preencha só as que for usar

ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
"@ | Out-File -FilePath $envPath -Encoding utf8
    Write-Host "  ✓ Criado: $envPath" -ForegroundColor Green
    Write-Host "  ⚠️  Edite esse arquivo e cole suas API keys" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ Já existe: $envPath"
}

# 5. Cria script de carregamento automático das keys
Write-Host "`n[5/5] Instalando loader de keys..." -ForegroundColor Yellow
$profileDir = Split-Path $PROFILE -Parent
if (-not (Test-Path $profileDir)) { New-Item -ItemType Directory -Path $profileDir -Force | Out-Null }

$loaderBlock = @"

# === AI-STACK KEYS LOADER ===
if (Test-Path "`$HOME\.ai-stack.env") {
    Get-Content "`$HOME\.ai-stack.env" | ForEach-Object {
        if (`$_ -match '^([^#=]+)=(.*)`$' -and `$matches[2].Trim() -ne '') {
            [Environment]::SetEnvironmentVariable(`$matches[1].Trim(), `$matches[2].Trim(), 'Process')
        }
    }
}
# === END AI-STACK ===
"@

if (-not (Test-Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force | Out-Null }
$profileContent = Get-Content $PROFILE -Raw -ErrorAction SilentlyContinue
if ($profileContent -notlike "*AI-STACK KEYS LOADER*") {
    Add-Content -Path $PROFILE -Value $loaderBlock
    Write-Host "  ✓ Loader adicionado ao PowerShell profile" -ForegroundColor Green
} else {
    Write-Host "  ✓ Loader já presente"
}

Write-Host "`n=== INSTALAÇÃO COMPLETA ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "  1. Edite as API keys em: $envPath" -ForegroundColor White
Write-Host "  2. Feche e reabra o PowerShell" -ForegroundColor White
Write-Host "  3. Use os comandos:" -ForegroundColor White
Write-Host "       claude                 # Claude Code (padrão)" -ForegroundColor Gray
Write-Host "       .\.ai-stack\use.ps1 gemini    # Aider com Gemini" -ForegroundColor Gray
Write-Host "       .\.ai-stack\use.ps1 gpt       # Aider com GPT" -ForegroundColor Gray
Write-Host "       .\.ai-stack\use.ps1 claude    # Aider com Claude" -ForegroundColor Gray
Write-Host ""
Write-Host "Guia completo: .ai-stack\GUIDE.md" -ForegroundColor Cyan
