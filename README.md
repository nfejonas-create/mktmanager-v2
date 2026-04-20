# mktmanager-v2

Sistema de gestão de publicações em redes sociais - MVP v1

## Stack Tecnológica

- **Backend**: Node.js + Express + TypeScript
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL
- **Cache/Fila**: Redis + Bull
- **Frontend**: React + Vite + Tailwind CSS
- **Storage**: Local (v1) / Cloud (produção)

## Estrutura do Projeto

```
mktmanager-v2/
├── prisma/              # Schema e migrations do Prisma
├── src/
│   ├── domains/         # Domínios de negócio
│   │   ├── social-accounts/   # Gestão de contas sociais
│   │   ├── publishing/        # Posts e agendamento
│   │   ├── content/           # Geração de conteúdo
│   │   └── analytics/         # Métricas e dashboard
│   ├── shared/          # Recursos compartilhados
│   │   ├── database/    # Prisma client
│   │   ├── queue/       # Bull + Redis
│   │   ├── security/    # Criptografia
│   │   └── storage/     # Upload de arquivos
│   ├── api/             # Express server e rotas
│   └── workers/         # Background jobs
├── uploads/             # Arquivos locais (dev)
└── web/                 # Frontend React
```

## Setup Inicial

1. **Iniciar containers Docker:**
   ```bash
   docker-compose up -d
   ```

2. **Instalar dependências:**
   ```bash
   npm install
   ```

3. **Configurar variáveis de ambiente:**
   ```bash
   cp .env.example .env
   # Editar .env com suas configurações
   ```

4. **Executar migrations:**
   ```bash
   npm run db:migrate
   ```

5. **Iniciar servidor:**
   ```bash
   npm run dev
   ```

6. **Iniciar worker (em outro terminal):**
   ```bash
   npm run worker
   ```

## Funcionalidades v1

- ✅ Múltiplas contas LinkedIn e Facebook
- ✅ Posts: texto, imagem, texto+imagem
- ✅ Agendamento com Redis/Bull
- ✅ Criptografia de tokens
- ✅ Dashboard básico
- ✅ Geração de conteúdo com IA

## Plataformas Suportadas

- LinkedIn (perfil e páginas)
- Facebook (perfil e páginas)

## Autenticação e isolamento

- `POST /api/auth/register` cria usuário e devolve `{ token, user }`
- `POST /api/auth/login` devolve `{ token, user }`
- `GET /api/auth/me` devolve o usuário autenticado
- Todas as rotas de contas, posts, conteúdo, analytics e automação exigem `Authorization: Bearer <token>`
- Tokens OAuth, API keys de IA e dados de automação ficam separados por `userId`

## Automação por usuário

- Cada usuário possui uma `AutomationConfig` própria
- O scheduler roda a cada 1 minuto e só enfileira jobs da configuração daquele usuário
- O worker `content-gen` recebe apenas `{ userId, automationConfigId }`
- O worker revalida `userId` + `automationConfigId`, decripta a API key daquele usuário e cria posts apenas nas contas padrão do mesmo usuário

## Simulação manual

1. Registre dois usuários diferentes via `POST /api/auth/register`
2. Faça login com cada um e guarde os dois tokens JWT
3. Conecte uma conta LinkedIn mock para cada usuário em `POST /api/accounts`
4. Salve uma `AutomationConfig` diferente para cada usuário em `PUT /api/automation`
5. Dispare `POST /api/automation/run-now` com o token de cada usuário
6. Valide em `GET /api/posts` que:
   - o texto de cada post segue o prompt do dono
   - o `Post.userId` bate com o usuário autenticado
   - não existe crossover entre usuários

## Licença

MIT
