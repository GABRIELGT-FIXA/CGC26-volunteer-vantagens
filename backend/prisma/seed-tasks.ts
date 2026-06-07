import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

// Horários em UTC (BRT = UTC-3, então 08:00 BRT = 11:00 UTC)
// Placeholder: 08:00–10:00 BRT — edite pelo painel admin
const tasks = [
  { name: 'Front Line',                         date: '2026-06-11', points: 350 },
  { name: 'Batismo',                            date: '2026-06-14', points: 300 },
  { name: 'Front Line',                         date: '2026-06-14', points: 350 },
  { name: 'Front Line',                         date: '2026-06-18', points: 350 },
  { name: 'Front Line',                         date: '2026-06-25', points: 350 },
  { name: 'Reunião de time',                    date: '2026-06-26', points: 400 },
  { name: 'Desmontar Connect',                  date: '2026-06-27', points: 450 },
  { name: 'EDP',                                date: '2026-06-28', points: 450 },
  { name: 'Front Line',                         date: '2026-06-28', points: 350 },
  { name: 'Front Line',                         date: '2026-07-02', points: 350 },
  { name: 'Desmontar Connect',                  date: '2026-07-04', points: 450 },
  { name: 'Presença reunião geral voluntários', date: '2026-07-04', points: 400 },
  { name: 'Front Line',                         date: '2026-07-09', points: 350 },
  { name: 'Presença viradão',                   date: '2026-07-10', points: 700 },
];

async function main() {
  for (const t of tasks) {
    const startTime = new Date(`${t.date}T11:00:00.000Z`); // 08:00 BRT
    const endTime   = new Date(`${t.date}T13:00:00.000Z`); // 10:00 BRT

    const created = await prisma.task.create({
      data: {
        name: t.name,
        description: 'Horário a definir — edite pelo painel admin',
        points: t.points,
        startTime,
        endTime,
        windowMinutes: 10,
      },
    });
    console.log(`✓ ${t.date} — ${t.name} (${t.points} pts) → ${created.id}`);
  }
  console.log('\n14 tarefas criadas com sucesso!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
