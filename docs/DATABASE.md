# DATABASE.md — Schema do Banco de Dados

## Modelo Prisma Completo

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────
// USUÁRIOS
// ─────────────────────────────────────────

model User {
  id               String    @id @default(uuid())
  fullName         String
  age              Int
  phone            String    @unique
  password         String    // bcrypt hash
  profilePhoto     String?   // path do arquivo
  role             Role      @default(PARTICIPANT)
  securityQuestion String
  securityAnswer   String    // bcrypt hash da resposta
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt

  teams            UserTeam[]
  participations   Participation[]
}

enum Role {
  ADMIN
  PARTICIPANT
}

// ─────────────────────────────────────────
// TIMES
// ─────────────────────────────────────────

model Team {
  id        String   @id @default(uuid())
  name      String   @unique
  createdAt DateTime @default(now())

  members       UserTeam[]
  participations Participation[]
}

model UserTeam {
  id        String   @id @default(uuid())
  userId    String
  teamId    String
  joinedAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  team Team @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@unique([userId, teamId])
}

// ─────────────────────────────────────────
// TAREFAS
// ─────────────────────────────────────────

model Task {
  id          String   @id @default(uuid())
  name        String
  description String?
  points      Int      @default(1)
  startTime   DateTime // início da tarefa
  endTime     DateTime // fim da tarefa
  
  // Janela de entrada: startTime até startTime + windowMinutes
  // Janela de saída:  endTime até endTime + windowMinutes
  windowMinutes Int    @default(10)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  participations Participation[]
}

// ─────────────────────────────────────────
// PARTICIPAÇÕES
// ─────────────────────────────────────────

model Participation {
  id           String              @id @default(uuid())
  userId       String
  taskId       String
  teamId       String              // time que recebe o ponto
  
  checkInPhoto  String?            // path da foto de entrada
  checkInTime   DateTime?          // horário que tirou a foto
  checkInValid  Boolean            @default(false)
  
  checkOutPhoto String?            // path da foto de saída
  checkOutTime  DateTime?
  checkOutValid Boolean            @default(false)
  
  status        ParticipationStatus @default(PENDING)
  pointsAwarded Int                @default(0)
  
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt

  user User @relation(fields: [userId], references: [id])
  task Task @relation(fields: [taskId], references: [id])
  team Team @relation(fields: [teamId], references: [id])

  @@unique([userId, taskId]) // um usuário só pode participar uma vez por tarefa
}

enum ParticipationStatus {
  PENDING       // aguardando check-in
  CHECKED_IN    // fez check-in, aguardando check-out
  COMPLETED     // fez os dois, pontos computados
  INCOMPLETE    // não completou (não fez check-out)
}

// ─────────────────────────────────────────
// CAMPANHAS DE MENSAGEM
// ─────────────────────────────────────────

model Campaign {
  id             String         @id @default(uuid())
  name           String
  message        String         // template com {{variáveis}}
  scheduledAt    DateTime       // data e hora agendada para disparo
  status         CampaignStatus @default(SCHEDULED)
  createdById    String         // userId do admin criador

  sentAt         DateTime?      // quando foi efetivamente disparada
  recipientCount Int?           // quantos usuários receberam

  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  createdBy User @relation(fields: [createdById], references: [id])
}

enum CampaignStatus {
  SCHEDULED   // agendada, aguardando disparo
  SENDING     // em processo de envio
  SENT        // disparada com sucesso
  FAILED      // falha no envio
  CANCELLED   // cancelada pelo admin
}
```

---

## Regras de Negócio do Banco

1. **Um usuário pode estar em múltiplos times** — via `UserTeam`.
2. **Uma participação é vinculada a um time específico** — o usuário escolhe no momento do check-in.
3. **Pontos só são computados ao completar check-out válido** — `status = COMPLETED`.
4. **Fotos inválidas** (fora da janela de tempo) são armazenadas mas `checkInValid/checkOutValid = false` e pontos não são dados.
5. **Admin pode editar `pointsAwarded` manualmente** em qualquer participação.

---

## Rankings (Queries)

### Ranking Individual
```sql
SELECT u.id, u.fullName, u.profilePhoto, SUM(p.pointsAwarded) as totalPoints
FROM User u
LEFT JOIN Participation p ON p.userId = u.id AND p.status = 'COMPLETED'
GROUP BY u.id
ORDER BY totalPoints DESC
```

### Ranking por Time
```sql
SELECT t.id, t.name, SUM(p.pointsAwarded) as totalPoints
FROM Team t
LEFT JOIN Participation p ON p.teamId = t.id AND p.status = 'COMPLETED'
GROUP BY t.id
ORDER BY totalPoints DESC
```
