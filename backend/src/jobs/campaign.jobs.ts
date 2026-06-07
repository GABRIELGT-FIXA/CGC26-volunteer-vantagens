import cron from 'node-cron';
import prisma from '../config/prisma';
import { broadcast } from '../services/whatsapp.service';

type ScheduledTask = ReturnType<typeof cron.schedule>;
const campaignJobs = new Map<string, ScheduledTask>();

function toCronExpression(date: Date): string {
  return `${date.getUTCMinutes()} ${date.getUTCHours()} ${date.getUTCDate()} ${date.getUTCMonth() + 1} *`;
}

export function scheduleCampaignJob(campaign: { id: string; message: string; scheduledAt: Date }) {
  const now = new Date();
  if (campaign.scheduledAt <= now) return;

  const expr = toCronExpression(campaign.scheduledAt);
  const job = cron.schedule(expr, () => {
    fireCampaignNow(campaign.id).catch(console.error);
  }, { timezone: 'UTC' });

  campaignJobs.set(campaign.id, job);
}

export function cancelCampaignJob(campaignId: string) {
  campaignJobs.get(campaignId)?.stop();
  campaignJobs.delete(campaignId);
}

export async function fireCampaignNow(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.status !== 'SCHEDULED') return;

  await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'SENDING' } });

  try {
    const count = await broadcast(campaign.message);
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'SENT', sentAt: new Date(), recipientCount: count },
    });
  } catch (err) {
    await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'FAILED' } });
    console.error('[Campaign] Falha no disparo:', err);
  }

  campaignJobs.delete(campaignId);
}

export async function initCampaignJobs() {
  const now = new Date();
  const campaigns = await prisma.campaign.findMany({
    where: { status: 'SCHEDULED', scheduledAt: { gt: now } },
  });
  campaigns.forEach(scheduleCampaignJob);
  console.log(`[Jobs] ${campaigns.length} campaign job(s) agendado(s)`);
}
