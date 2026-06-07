# WHATSAPP.md — Integração com Evolution API

## Visão Geral

A integração com a Evolution API é responsável por dois tipos de disparo automático de WhatsApp:

1. **Jobs de tarefa** — lembretes automáticos de check-in e check-out gerados pelo sistema quando uma tarefa é criada/editada.
2. **Campanhas manuais** — mensagens livres criadas pelo admin com agendamento e corpo personalizável via variáveis. Ver detalhes em FEATURES.md e UI.md.

---

## Configuração

Variáveis de ambiente necessárias:
```env
EVOLUTION_API_URL=https://sua-evolution.com
EVOLUTION_API_KEY=sua_api_key
EVOLUTION_INSTANCE=nome_da_instancia
```

---

## Serviço de WhatsApp

Crie o arquivo `src/services/whatsapp.service.ts`:

```typescript
// Envio de mensagem simples
async function sendMessage(phone: string, message: string): Promise<void>

// Formata o número para o padrão da Evolution: 55 + DDD + número
function formatPhone(phone: string): string
// Ex: "11999999999" → "5511999999999"
```

Endpoint da Evolution para envio:
```
POST {EVOLUTION_API_URL}/message/sendText/{EVOLUTION_INSTANCE}
Headers: { apikey: EVOLUTION_API_KEY }
Body: { number: "5511999999999", text: "Mensagem aqui" }
```

---

## Jobs de Agendamento (Cron)

Arquivo: `src/jobs/whatsapp.jobs.ts`

### Ao Iniciar o Servidor
- Carregar todas as tarefas com `startTime` e `endTime` futuros.
- Para cada tarefa, agendar dois jobs:
  1. **Job de Check-in**: dispara em `startTime` (horário exato de início).
  2. **Job de Check-out**: dispara em `endTime` (horário exato de fim).

### Ao Criar/Editar uma Tarefa
- Cancelar jobs anteriores daquela tarefa (se existirem).
- Reagendar com os novos horários.

### Variáveis disponíveis nas mensagens

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `{{taskName}}` | Nome da atividade | Front Line |
| `{{date}}` | Data da atividade (DD/MM) | 11/06 |
| `{{startTime}}` | Horário de início (HH:mm) | 08:00 |
| `{{endTime}}` | Horário de fim (HH:mm) | 10:00 |
| `{{points}}` | Pontuação da atividade | 350 |
| `{{windowMinutes}}` | Duração da janela em minutos | 10 |

### Mensagem de Check-in
```
📸 *{{taskName}}* começou agora!

📅 Data: {{date}}
⏰ Horário: {{startTime}} — {{endTime}}
⭐ Pontuação: {{points}} pontos

Você tem {{windowMinutes}} minutos para registrar sua chegada.

Acesse a plataforma e tire sua foto de entrada! 🏁
```

### Mensagem de Check-out
```
📸 *{{taskName}}* está encerrando!

📅 Data: {{date}}
⏰ Horário: {{startTime}} — {{endTime}}
⭐ Pontuação: {{points}} pontos

Você tem {{windowMinutes}} minutos para registrar sua saída.

Acesse a plataforma e tire sua foto de saída! ✅
```

---

## Gerenciamento dos Jobs de Campanha

Arquivo: `src/jobs/campaign.jobs.ts`

- Ao criar uma campanha `SCHEDULED`, registrar na `Map<campaignId, CronJob>`.
- Ao disparar: buscar todos os usuários `role = PARTICIPANT`, enviar mensagem para cada um com as variáveis substituídas, atualizar `status = SENT`, `sentAt` e `recipientCount`.
- Ao editar horário: cancelar job anterior e reagendar.
- Ao cancelar: remover da Map.
- O campo `message` pode conter qualquer variável da tabela acima — a substituição ocorre em runtime no momento do disparo, não no momento da criação.

---

## Gerenciamento dos Jobs de Tarefa

- Use uma estrutura `Map<taskId, { checkInJob, checkOutJob }>` em memória para controlar os jobs agendados.
- Ao excluir uma tarefa, cancelar e remover da Map.
- Se o servidor reiniciar, o carregamento inicial garante que todos os jobs sejam reagendados.

---

## Destinatários

- O disparo é feito para **todos os usuários cadastrados** com `role = PARTICIPANT`.
- Não filtrar por quem já participou — enviar para todos indiscriminadamente como lembrete.
- Usar o campo `phone` do usuário (já no formato sem o 55).

---

## Tratamento de Erros

- Se o envio falhar para um usuário, logar o erro e continuar para o próximo.
- Não lançar exceção que cancele o job inteiro.
- Implementar retry simples: 3 tentativas com 5 segundos de intervalo.
