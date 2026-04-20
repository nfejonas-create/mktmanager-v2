# Frontend v1 parity - backend gaps

## Endpoints faltantes ou incompletos

1. `PUT /api/auth/me`
   - payload esperado:
   ```json
   {
     "name": "Nome do usuário",
     "profiles": {
       "linkedin": "https://linkedin.com/in/...",
       "facebook": "https://facebook.com/...",
       "site": "https://...",
       "other": "https://..."
     }
   }
   ```
   - uso no frontend:
     - salvar bloco Perfil em `/configuracoes`
     - salvar links do Dashboard

2. `POST /api/accounts/sync`
   - payload esperado: vazio
   - retorno esperado:
   ```json
   { "success": true }
   ```
   - uso no frontend:
     - botão `Sincronizar Métricas` no `/dashboard`

3. `GET /api/analytics/summary`
   - resposta esperada:
   ```json
   {
     "posts30d": 12,
     "views30d": 1840,
     "likes30d": 326,
     "followersTotal": 942
   }
   ```
   - uso no frontend:
     - cards de métricas do `/dashboard`

4. `GET /api/analytics?days=14`
   - resposta esperada:
   ```json
   [
     { "date": "01/04", "views": 120, "likes": 24, "posts": 1 }
   ]
   ```
   - uso no frontend:
     - gráfico de linha do `/dashboard`

5. `POST /api/content/upload-material`
   - payload esperado: `multipart/form-data`
     - `file`
     - `platform`
     - `quantity`
     - `tone`
   - resposta esperada:
   ```json
   {
     "posts": [
       { "content": "..." }
     ]
   }
   ```
   - uso no frontend:
     - aba `Upload de Material` em `/conteudo`

6. `POST /api/content/analyze`
   - payload esperado:
   ```json
   { "text": "conteúdo a ser analisado" }
   ```
   - resposta esperada:
   ```json
   {
     "score": 8,
     "strengths": ["..."],
     "improvements": ["..."],
     "rewritten": "..."
   }
   ```
   - uso no frontend:
     - aba `Analisar Texto` em `/conteudo`

7. `POST /api/content/generate-week`
   - payload esperado: vazio
   - resposta esperada:
   ```json
   { "success": true, "created": 7 }
   ```
   - uso no frontend:
     - botão `Gerar semana` no histórico

8. `POST /api/posts/schedule-batch`
   - payload esperado:
   ```json
   {
     "dates": ["2026-04-20T09:00:00.000Z"],
     "status": "DRAFT"
   }
   ```
   - uso no frontend:
     - botão `Agendar rascunhos` no histórico
