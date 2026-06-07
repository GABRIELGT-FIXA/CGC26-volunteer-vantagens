# ARCHITECTURE.md — Arquitetura do Sistema

## Stack Tecnológica

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL
- **Autenticação**: JWT (access token + refresh token)
- **Upload de Arquivos**: Multer + armazenamento local (ou S3 configurável via `.env`)
- **Agendamento de Jobs**: node-cron (para disparos de WhatsApp nos horários das janelas)
- **Validação**: Zod

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Estilização**: Tailwind CSS
- **Componentes**: shadcn/ui
- **Estado Global**: Zustand
- **Requisições**: Axios + React Query
- **Upload de Foto**: react-webcam ou input file

### Integrações
- **WhatsApp**: Evolution API (REST)

---

## Estrutura de Pastas

```
/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/          # env, constants
│   │   ├── controllers/     # lógica HTTP
│   │   ├── services/        # regras de negócio
│   │   ├── middlewares/     # auth, upload, error handler
│   │   ├── routes/          # definição de rotas
│   │   ├── jobs/            # cron jobs WhatsApp
│   │   ├── utils/           # helpers, timezone, janelas
│   │   └── app.ts
│   └── .env
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/          # login, cadastro, recuperar senha
│   │   ├── (participant)/   # área do participante
│   │   │   ├── dashboard/
│   │   │   ├── tarefas/
│   │   │   └── ranking/
│   │   └── (admin)/         # área do administrador
│   │       ├── dashboard/
│   │       ├── usuarios/
│   │       ├── tarefas/
│   │       ├── times/
│   │       └── ranking/
│   ├── components/
│   ├── lib/
│   └── .env.local
│
└── docs/
```

---

## Variáveis de Ambiente

### Backend `.env`
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
JWT_SECRET=seu_secret_aqui
JWT_REFRESH_SECRET=seu_refresh_secret_aqui
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
TIMEZONE=America/Sao_Paulo

# Evolution API
EVOLUTION_API_URL=https://sua-evolution.com
EVOLUTION_API_KEY=sua_api_key
EVOLUTION_INSTANCE=nome_da_instancia

# Admin padrão
ADMIN_PHONE=5511999999999
ADMIN_PASSWORD=senha_admin_inicial
```

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## Decisões de Arquitetura

- **JWT stateless**: access token de curta duração, refresh token em httpOnly cookie.
- **Janelas de tempo**: calculadas no backend, frontend apenas consulta se janela está aberta.
- **Fotos**: armazenadas em disco com nome UUID, path salvo no banco. Nunca retornar path absoluto, sempre URL relativa servida pelo backend.
- **Pontos por time**: tabela de relação `UserTeam` permite múltiplos times por usuário. Ao registrar participação, usuário escolhe qual time recebe o ponto.
- **Cron jobs**: ao iniciar o servidor, carrega todas as tarefas futuras e agenda os disparos de WhatsApp para o horário de abertura de cada janela.
