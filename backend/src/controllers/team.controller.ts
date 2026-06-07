import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as teamService from '../services/team.service';

export async function listTeams(req: Request, res: Response, next: NextFunction) {
  try { res.json(await teamService.listTeams()); } catch (e) { next(e); }
}

export async function getTeam(req: Request, res: Response, next: NextFunction) {
  try { res.json(await teamService.getTeam(req.params.id as string)); } catch (e) { next(e); }
}

export async function createTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = z.object({ name: z.string().min(2) }).parse(req.body);
    res.status(201).json(await teamService.createTeam(name));
  } catch (e) { next(e); }
}

export async function updateTeam(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = z.object({ name: z.string().min(2) }).parse(req.body);
    res.json(await teamService.updateTeam(req.params.id as string, name));
  } catch (e) { next(e); }
}

export async function deleteTeam(req: Request, res: Response, next: NextFunction) {
  try { await teamService.deleteTeam(req.params.id as string); res.status(204).send(); } catch (e) { next(e); }
}

export async function addMember(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId } = z.object({ userId: z.string().uuid() }).parse(req.body);
    res.status(201).json(await teamService.addMember(req.params.id as string, userId));
  } catch (e) { next(e); }
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try { await teamService.removeMember(req.params.id as string, req.params.userId as string); res.status(204).send(); } catch (e) { next(e); }
}
