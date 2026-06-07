import prisma from '../config/prisma';
import { scheduleCampaignJob, cancelCampaignJob, fireCampaignNow } from '../jobs/campaign.jobs';

const campaignSelect = {
  id: true, name: true, message: true, scheduledAt: true,
  status: true, sentAt: true, recipientCount: true,
  createdById: true, createdAt: true, updatedAt: true,
  createdBy: { select: { id: true, fullName: true } },
};

export async function listCampaigns(filters: { status?: string; date?: string }) {
  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;
  if (filters.date) {
    const day = new Date(filters.date);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    where.scheduledAt = { gte: day, lt: next };
  }
  return prisma.campaign.findMany({ where, select: campaignSelect, orderBy: { scheduledAt: 'desc' } });
}

export async function getCampaign(id: string) {
  const c = await prisma.campaign.findUnique({ where: { id }, select: campaignSelect });
  if (!c) throw Object.assign(new Error('Campanha não encontrada'), { status: 404 });
  return c;
}

export async function createCampaign(data: {
  name: string; message: string; scheduledAt: Date; createdById: string;
}) {
  const campaign = await prisma.campaign.create({ data, select: campaignSelect });
  scheduleCampaignJob(campaign);
  return campaign;
}

export async function updateCampaign(id: string, data: {
  name?: string; message?: string; scheduledAt?: Date;
}) {
  const campaign = await getCampaign(id);
  if (campaign.status !== 'SCHEDULED') {
    throw Object.assign(new Error('Somente campanhas agendadas podem ser editadas'), { status: 409 });
  }
  const updated = await prisma.campaign.update({ where: { id }, data, select: campaignSelect });
  if (data.scheduledAt) {
    cancelCampaignJob(id);
    scheduleCampaignJob(updated);
  }
  return updated;
}

export async function cancelCampaign(id: string) {
  const campaign = await getCampaign(id);
  if (campaign.status !== 'SCHEDULED') {
    throw Object.assign(new Error('Somente campanhas agendadas podem ser canceladas'), { status: 409 });
  }
  cancelCampaignJob(id);
  return prisma.campaign.update({ where: { id }, data: { status: 'CANCELLED' }, select: campaignSelect });
}

export async function sendNow(id: string) {
  const campaign = await getCampaign(id);
  if (campaign.status !== 'SCHEDULED') {
    throw Object.assign(new Error('Somente campanhas agendadas podem ser disparadas'), { status: 409 });
  }
  cancelCampaignJob(id);
  await fireCampaignNow(id);
  return getCampaign(id);
}
