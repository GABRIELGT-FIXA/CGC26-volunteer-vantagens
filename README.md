# Volunteer Vantagens — ConnectConference'26

Plataforma de gestão de participação de voluntários com check-in/check-out por foto, ranking por pontos, campanhas de WhatsApp, sistema de notícias e temas por time.

## Stack

- **Backend**: Node.js + Express + Prisma + PostgreSQL (Neon)
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui + Zustand + React Query
- **Integração**: Evolution API (WhatsApp)

## Estrutura

```
CGC26/
├── backend/     API REST (Express + Prisma)
├── frontend/    App web (Next.js)
└── docs/        Documentação do projeto
```

## Como rodar

### Backend

```bash
cd backend
npm install
cp .env.example .env   # preencha com suas credenciais
npm run prisma:push    # cria as tabelas no banco
npm run prisma:seed    # cria o admin inicial
npm run dev            # http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
# crie .env.local com: NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm run dev            # http://localhost:3000
```

## Funcionalidades

- **Autenticação** por telefone + senha, recuperação via pergunta de segurança
- **Check-in / Check-out** por foto dentro de janelas de tempo configuráveis
- **Ranking** individual e por time, atualização em tempo real
- **Campanhas WhatsApp** com agendamento e variáveis dinâmicas
- **Notícias** com imagem, popup de nova notícia
- **14 temas de time** com troca de cor em toda a aplicação
- **Painel admin** para CRUD de usuários, times, tarefas, campanhas e notícias

## Variáveis de ambiente

Veja `backend/.env.example` para a lista completa. **Nunca** versione o arquivo `.env`.
