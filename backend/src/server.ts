import app from './app';
import { env } from './config/env';
import { initTaskJobs } from './jobs/task.jobs';
import { initCampaignJobs } from './jobs/campaign.jobs';

app.listen(env.port, async () => {
  console.log(`Server running on port ${env.port}`);
  // Agendamento de jobs não deve derrubar o servidor se o banco estiver
  // temporariamente indisponível no boot (ex: cold start do Neon).
  try {
    await initTaskJobs();
    await initCampaignJobs();
  } catch (e) {
    console.error('[Jobs] Falha ao agendar no boot (seguindo sem derrubar):', (e as Error).message);
  }
});
