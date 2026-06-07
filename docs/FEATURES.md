# FEATURES.md — Especificação Funcional

## 1. Gestão de Tarefas (Admin)

### Criar Tarefa
- Campos: nome, descrição (opcional), pontos, data/hora de início, data/hora de fim, duração da janela em minutos (padrão: 10).
- Ao salvar, o sistema agenda automaticamente os jobs de WhatsApp para as janelas.

### Editar Tarefa
- Todos os campos editáveis.
- Se a tarefa já tiver participações, exibir aviso antes de editar horários.
- Ao editar horários, reagendar jobs de WhatsApp.

### Listar Tarefas
- Filtros: data, status (futura, em andamento, encerrada).
- Exibir contagem de participações por tarefa.

### Excluir Tarefa
- Soft delete ou hard delete com confirmação.
- Se houver participações, bloquear exclusão e exibir aviso.

---

## 2. Janelas de Tempo

### Lógica das Janelas
```
Janela de Check-in:  startTime  →  startTime + windowMinutes
Janela de Check-out: endTime    →  endTime + windowMinutes
```

### Endpoint de Status da Janela
- O frontend consulta o backend para saber se a janela está aberta.
- Backend retorna: `{ checkInOpen: boolean, checkOutOpen: boolean, task: TaskInfo }`.
- Frontend não calcula horários — apenas exibe o que o backend informa.

### Comportamento do Botão de Foto
- Fora da janela: botão desabilitado com mensagem explicativa.
- Dentro da janela: botão habilitado, abre câmera/upload.
- Após foto enviada com sucesso: botão some ou vira confirmação visual.

---

## 3. Registro de Participação (Participante)

### Check-in
1. Participante acessa lista de tarefas do dia.
2. Vê tarefa com janela de check-in aberta.
3. Clica em "Registrar Chegada".
4. Se o usuário está em mais de um time: exibir seleção de time antes de tirar a foto.
5. Tira foto ou faz upload.
6. Backend valida janela novamente (servidor é a fonte da verdade).
7. Salva foto, registra horário, marca `checkInValid = true`, status → `CHECKED_IN`.

### Check-out
1. Participante vê tarefa com status `CHECKED_IN` e janela de check-out aberta.
2. Clica em "Registrar Saída".
3. Tira foto ou faz upload.
4. Backend valida janela.
5. Salva foto, registra horário, marca `checkOutValid = true`, status → `COMPLETED`.
6. Pontos são atribuídos: `pointsAwarded = task.points`.

### Regras de Validação
- Não é possível fazer check-out sem ter feito check-in.
- Não é possível fazer check-in ou check-out fora da janela de tempo.
- Cada usuário participa de cada tarefa no máximo uma vez.

---

## 4. Rankings

### Ranking Individual
- Exibe: posição, foto de perfil, nome, time(s), total de pontos.
- Ordenado por total de pontos decrescente.
- Atualização em tempo real (polling a cada 30s ou WebSocket).

### Ranking por Time
- Exibe: posição, nome do time, total de pontos acumulados por todos os membros.
- Ordenado por total de pontos decrescente.

---

## 5. Área do Administrador

### Dashboard
- Total de participantes, total de times, total de tarefas, participações do dia.
- Gráfico simples de pontos por time.

### Gestão de Usuários
- Listar todos os usuários com filtros (nome, time, telefone).
- Ver detalhes de um usuário (participações, pontos, times).
- Editar qualquer campo do usuário (nome, idade, time, foto, telefone).
- Adicionar usuário manualmente (mesmo formulário de cadastro público).
- Excluir usuário (com confirmação).
- Editar pontos de uma participação manualmente (campo numérico direto).

### Gestão de Times
- Criar, editar, excluir times.
- Ver membros de cada time.
- Adicionar/remover membros de um time.

### Gestão de Tarefas
- CRUD completo (ver seção 1).
- Ver lista de quem participou de cada tarefa com status de check-in/check-out e fotos.

---

## 6. Campanhas de Mensagem WhatsApp (Admin)

Permite que o admin crie, edite e exclua disparos automáticos de WhatsApp para todos os participantes cadastrados, com agendamento de horário e suporte a variáveis dinâmicas no corpo da mensagem.

### Criar Campanha
- Campos: nome (interno, para organização), corpo da mensagem, data/hora do agendamento.
- O corpo aceita variáveis no formato `{{variavel}}` — ver lista em WHATSAPP.md.
- Ao salvar, o sistema registra a campanha com `status = SCHEDULED` e agenda o job.

### Editar Campanha
- Permitido apenas enquanto `status = SCHEDULED`.
- Se o horário for alterado, o job anterior é cancelado e um novo é agendado.
- Campanhas já enviadas, em envio ou canceladas são somente leitura.

### Excluir / Cancelar Campanha
- Permitido apenas enquanto `status = SCHEDULED`.
- Cancela o job agendado e muda status para `CANCELLED` (soft) ou remove o registro (hard delete — escolha na implementação).

### Disparar Agora
- O admin pode forçar o disparo imediato de uma campanha `SCHEDULED` sem esperar o horário agendado.

### Destinatários
- Sempre todos os usuários com `role = PARTICIPANT`.
- Não há segmentação por time nesta versão.

### Preview em Tempo Real
- Ao digitar o corpo da mensagem, o sistema exibe uma prévia renderizada substituindo as variáveis por valores de exemplo.
- Inspirado na interface da Meta Business Suite.
- Ver detalhes de UI na seção correspondente em UI.md.

---

## 7. Perfil do Participante

- Ver próprios pontos e posição no ranking.
- Ver histórico de participações com status.
- Editar foto de perfil e senha.
- Não pode editar nome, telefone, time diretamente (solicitar ao admin).
