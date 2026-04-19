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

## Licença

MIT