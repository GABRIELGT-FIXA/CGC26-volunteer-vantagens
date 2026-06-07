import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as campaignService from '../services/campaign.service';
import { WHATSAPP_VARIABLES } from '../config/constants';

export async function listCampaigns(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as string | undefined;
    const date = req.query.date as string | undefined;
    res.json(await campaignService.listCampaigns({ status, date }));
  } catch (e) { next(e); }
}

export async function getCampaign(req: Request, res: Response, next: NextFunction) {
  try { res.json(await campaignService.getCampaign(req.params.id as string)); } catch (e) { next(e); }
}

export async function createCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const data = z.object({
      name: z.string().min(2),
      message: z.string().min(1),
      scheduledAt: z.coerce.date(),
    }).parse(req.body);
    res.status(201).json(await campaignService.createCampaign({ ...data, createdById: req.user!.userId }));
  } catch (e) { next(e); }
}

export async function updateCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const data = z.object({
      name: z.string().min(2).optional(),
      message: z.string().min(1).optional(),
      scheduledAt: z.coerce.date().optional(),
    }).parse(req.body);
    res.json(await campaignService.updateCampaign(req.params.id as string, data));
  } catch (e) { next(e); }
}

export async function cancelCampaign(req: Request, res: Response, next: NextFunction) {
  try { res.json(await campaignService.cancelCampaign(req.params.id as string)); } catch (e) { next(e); }
}

export async function sendNow(req: Request, res: Response, next: NextFunction) {
  try { res.json(await campaignService.sendNow(req.params.id as string)); } catch (e) { next(e); }
}

export function getVariables(_req: Request, res: Response) {
  res.json({ variables: WHATSAPP_VARIABLES });
}
