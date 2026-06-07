import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as userService from '../services/user.service';
import { SECURITY_QUESTIONS } from '../config/constants';

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try { res.json(await userService.listUsers()); } catch (e) { next(e); }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try { res.json(await userService.getUser(req.params.id as string)); } catch (e) { next(e); }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try { res.json(await userService.getMe(req.user!.userId)); } catch (e) { next(e); }
}

export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const data = z.object({
      fullName: z.string().min(2),
      age: z.number().int().min(10),
      phone: z.string().min(10),
      password: z.string().min(6),
      securityQuestion: z.enum(SECURITY_QUESTIONS as [string, ...string[]]),
      securityAnswer: z.string().min(1),
      teamIds: z.array(z.string().uuid()).default([]),
    }).parse(req.body);
    const profilePhoto = req.file ? `/uploads/${req.file.filename}` : undefined;
    res.status(201).json(await userService.createUser({ ...data, profilePhoto }));
  } catch (e) { next(e); }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const data = z.object({
      fullName: z.string().min(2).optional(),
      age: z.number().int().min(10).optional(),
      phone: z.string().min(10).optional(),
      teamIds: z.array(z.string().uuid()).optional(),
    }).parse(req.body);
    const profilePhoto = req.file ? `/uploads/${req.file.filename}` : undefined;
    res.json(await userService.updateUser(req.params.id as string, { ...data, ...(profilePhoto ? { profilePhoto } : {}) }));
  } catch (e) { next(e); }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try { await userService.deleteUser(req.params.id as string); res.status(204).send(); } catch (e) { next(e); }
}

export async function updateMyPhoto(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) { res.status(400).json({ error: 'Nenhuma foto enviada' }); return; }
    res.json(await userService.updatePhoto(req.user!.userId, req.file.filename));
  } catch (e) { next(e); }
}

export async function updateMyPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(6),
    }).parse(req.body);
    await userService.updatePassword(req.user!.userId, currentPassword, newPassword);
    res.json({ message: 'Senha atualizada' });
  } catch (e) { next(e); }
}
