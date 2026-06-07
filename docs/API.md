# API.md — Endpoints da API REST

Base URL: `/api`

Convenções:
- Autenticado: requer `Authorization: Bearer <token>`
- Admin: requer autenticado + `role = ADMIN`
- Respostas de erro: `{ error: string, details?: any }`

---

## Auth

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/auth/check-phone` | Público | Verifica se telefone existe |
| POST | `/auth/register` | Público | Cadastra novo participante |
| POST | `/auth/login` | Público | Login com telefone + senha |
| POST | `/auth/refresh` | Público | Renova access token via refresh cookie |
| POST | `/auth/logout` | Autenticado | Invalida refresh token |
| POST | `/auth/security-question` | Público | Retorna pergunta de segurança pelo telefone |
| POST | `/auth/verify-security-answer` | Público | Valida resposta e retorna reset token |
| POST | `/auth/reset-password` | Público | Reseta senha com reset token |

---

## Usuários

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/users` | Admin | Lista todos os usuários |
| GET | `/users/:id` | Admin | Detalhes de um usuário |
| POST | `/users` | Admin | Cria usuário manualmente |
| PUT | `/users/:id` | Admin | Edita usuário |
| DELETE | `/users/:id` | Admin | Exclui usuário |
| GET | `/users/me` | Autenticado | Dados do usuário logado |
| PUT | `/users/me/photo` | Autenticado | Atualiza foto de perfil |
| PUT | `/users/me/password` | Autenticado | Atualiza senha |

---

## Times

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/teams` | Autenticado | Lista todos os times |
| GET | `/teams/:id` | Autenticado | Detalhes de um time com membros |
| POST | `/teams` | Admin | Cria time |
| PUT | `/teams/:id` | Admin | Edita time |
| DELETE | `/teams/:id` | Admin | Exclui time |
| POST | `/teams/:id/members` | Admin | Adiciona membro ao time |
| DELETE | `/teams/:id/members/:userId` | Admin | Remove membro do time |

---

## Tarefas

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/tasks` | Autenticado | Lista tarefas (filtros: data, status) |
| GET | `/tasks/:id` | Autenticado | Detalhes da tarefa |
| GET | `/tasks/:id/window-status` | Autenticado | Status das janelas de tempo |
| POST | `/tasks` | Admin | Cria tarefa |
| PUT | `/tasks/:id` | Admin | Edita tarefa |
| DELETE | `/tasks/:id` | Admin | Exclui tarefa |
| GET | `/tasks/:id/participations` | Admin | Lista participações de uma tarefa |

---

## Participações

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| POST | `/participations/:taskId/checkin` | Autenticado | Registra check-in com foto |
| POST | `/participations/:taskId/checkout` | Autenticado | Registra check-out com foto |
| GET | `/participations/my` | Autenticado | Histórico do usuário logado |
| PUT | `/participations/:id/points` | Admin | Edita pontos manualmente |

---

## Rankings

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/rankings/individual` | Autenticado | Ranking individual |
| GET | `/rankings/teams` | Autenticado | Ranking por times |

---

## Campanhas de Mensagem

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/campaigns` | Admin | Lista todas as campanhas (filtros: status, data) |
| GET | `/campaigns/:id` | Admin | Detalhes de uma campanha |
| POST | `/campaigns` | Admin | Cria campanha agendada |
| PUT | `/campaigns/:id` | Admin | Edita campanha (somente se `status = SCHEDULED`) |
| DELETE | `/campaigns/:id` | Admin | Cancela/exclui campanha (somente se `status = SCHEDULED`) |
| POST | `/campaigns/:id/send-now` | Admin | Dispara campanha imediatamente (ignora `scheduledAt`) |

### Body — POST/PUT `/campaigns`
```json
{
  "name": "Lembrete Front Line",
  "message": "Olá! 👋 A atividade *{{taskName}}* acontece hoje, {{date}}, das {{startTime}} às {{endTime}}. Vale {{points}} pontos! Não esqueça de registrar sua presença. 🏁",
  "scheduledAt": "2026-06-11T07:45:00-03:00"
}
```

### Resposta — GET `/campaigns/:id`
```json
{
  "id": "uuid",
  "name": "Lembrete Front Line",
  "message": "...",
  "scheduledAt": "2026-06-11T07:45:00-03:00",
  "status": "SCHEDULED",
  "sentAt": null,
  "recipientCount": null,
  "createdById": "uuid",
  "createdAt": "..."
}
```

---

## Notícias

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/news` | Autenticado | Lista notícias (mais recentes primeiro) |
| GET | `/news/:id` | Autenticado | Detalhes de uma notícia |
| POST | `/news` | Admin | Cria notícia (multipart, campo `image`) |
| PUT | `/news/:id` | Admin | Edita notícia |
| DELETE | `/news/:id` | Admin | Exclui notícia |

---

## Uploads

- Fotos de perfil: `PUT /users/me/photo` — multipart/form-data, campo `photo`
- Fotos de check-in/out: incluídas no body de `/participations/:taskId/checkin` e `/checkout` — multipart/form-data, campo `photo`
- Servir arquivos: `GET /uploads/:filename` — público (URLs relativas nas respostas)
