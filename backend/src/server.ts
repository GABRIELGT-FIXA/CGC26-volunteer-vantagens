import app from './app';
import { env } from './config/env';
import { initTaskJobs } from './jobs/task.jobs';
import { initCampaignJobs } from './jobs/campaign.jobs';

app.listen(env.port, async () => {
  console.log(`Server running on port ${env.port}`);
  await initTaskJobs();
  await initCampaignJobs();
});
