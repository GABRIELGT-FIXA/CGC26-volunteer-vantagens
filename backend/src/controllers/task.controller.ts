import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as taskService from '../services/task.service';

export async function listTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const date = req.query.date as string | undefined;
    const status = req.query.status as string | undefined;
    res.json(await taskService.listTasks({ date, status }));
  } catch (e) { next(e); }
}

export async function getTask(req: Request, res: Response, next: NextFunction) {
  try { res.json(await taskService.getTask(req.params.id as string)); } catch (e) { next(e); }
}

export async function getWindowStatus(req: Request, res: Response, next: NextFunction) {
  try { res.json(await taskService.getWindowStatus(req.params.id as string)); } catch (e) { next(e); }
}

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const data = z.object({
      name: z.string().min(2),
      description: z.string().optional(),
      points: z.number().int().min(1),
      startTime: z.coerce.date(),
      endTime: z.coerce.date(),
      windowMinutes: z.number().int().min(1).default(10),
      checkOutOffsetMinutes: z.number().int().default(0),
    }).parse(req.body);
    res.status(201).json(await taskService.createTask(data));
  } catch (e) { next(e); }
}

export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const data = z.object({
      name: z.string().min(2).optional(),
      description: z.string().optional(),
      points: z.number().int().min(1).optional(),
      startTime: z.coerce.date().optional(),
      endTime: z.coerce.date().optional(),
      windowMinutes: z.number().int().min(1).optional(),
      checkOutOffsetMinutes: z.number().int().optional(),
    }).parse(req.body);
    res.json(await taskService.updateTask(req.params.id as string, data));
  } catch (e) { next(e); }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try { await taskService.deleteTask(req.params.id as string); res.status(204).send(); } catch (e) { next(e); }
}

export async function getTaskParticipations(req: Request, res: Response, next: NextFunction) {
  try { res.json(await taskService.getTaskParticipations(req.params.id as string)); } catch (e) { next(e); }
}
