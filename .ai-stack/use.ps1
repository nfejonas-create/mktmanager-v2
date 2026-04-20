# AI-STACK MODEL SWITCHER
# Uso: .\use.ps1 <modelo>
# Modelos: claude | sonnet | opus | haiku | gpt | gemini | deepseek | local

param([string]$model = "claude")

# Carrega keys
if (Test-Path "$HOME\.ai-stack.env") {
    Get-Content "$HOME\.ai-stack.env" | ForEach-Object {
        if ($_ -match '^([^#=]+)=(.*)$' -and $matches[2].Trim() -ne '') {
            [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
        }
    }
}

$modelMap = @{
    "claude"   = @{ tool = "aider"; args = "--model sonnet" }
    "sonnet"   = @{ tool = "aider"; args = "--model sonnet" }
    "opus"     = @{ tool = "aider"; args = "--model claude-opus-4-6" }
    "haiku"    = @{ tool = "aider"; args = "--model claude-haiku-4-5" }
    "gpt"      = @{ tool = "aider"; args = "--model gpt-5" }
    "gemini"   = @{ tool = "aider"; args = "--model gemini/gemini-2.5-pro" }
    "deepseek" = @{ tool = "aider"; args = "--model deepseek/deepseek-coder" }
    "local"    = @{ tool = "aider"; args = "--model ollama/deepseek-coder-v2" }
}

if (-not $modelMap.ContainsKey($model)) {
    Write-Host "Modelos disponíveis:" -ForegroundColor Yellow
    $modelMap.Keys | ForEach-Object { Write-Host "  $_" }
    exit 1
}

$config = $modelMap[$model]
Write-Host "▶ Iniciando $($config.tool) com modelo: $model" -ForegroundColor Cyan
Invoke-Expression "$($config.tool) $($config.args)"
