import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';
import { env } from '../config/env';

const REFRESH_COOKIE = 'refreshToken';
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function checkPhone(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone } = z.object({ phone: z.string().min(10) }).parse(req.body);
    const result = await authService.checkPhone(phone);
    res.json(result);
  } catch (e) { next(e); }
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const schema = z.object({
      fullName: z.string().min(2),
      age: z.coerce.number().int().min(10).max(120),
      phone: z.string().min(10),
      password: z.string().min(6),
      securityQuestion: z.string(),
      securityAnswer: z.string().min(1),
      // FormData pode enviar string única ou array; normaliza para array
      teamIds: z.union([
        z.string().uuid().transform((v) => [v]),
        z.array(z.string().uuid()),
      ]).optional().transform((v) => v ?? []),
    });
    const data = schema.parse(req.body);
    const profilePhoto = req.file ? `/uploads/${req.file.filename}` : undefined;
    const user = await authService.register({ ...data, profilePhoto });
    res.status(201).json(user);
  } catch (e) { next(e); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, password } = z.object({ phone: z.string(), password: z.string() }).parse(req.body);
    const { accessToken, refreshToken } = await authService.login(phone, password);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    res.json({ accessToken });
  } catch (e) { next(e); }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies[REFRESH_COOKIE];
    if (!token) { res.status(401).json({ error: 'Sem refresh token' }); return; }
    const { accessToken, refreshToken } = await authService.refreshToken(token);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTS);
    res.json({ accessToken });
  } catch (e) { next(e); }
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(REFRESH_COOKIE);
  res.json({ message: 'Logout realizado' });
}

export async function securityQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone } = z.object({ phone: z.string() }).parse(req.body);
    const result = await authService.getSecurityQuestion(phone);
    res.json(result);
  } catch (e) { next(e); }
}

export async function verifySecurityAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    const { phone, answer } = z.object({ phone: z.string(), answer: z.string() }).parse(req.body);
    const result = await authService.verifySecurityAnswer(phone, answer);
    res.json(result);
  } catch (e) { next(e); }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { resetToken, newPassword } = z.object({
      resetToken: z.string(),
      newPassword: z.string().min(6),
    }).parse(req.body);
    await authService.resetPassword(resetToken, newPassword);
    res.json({ message: 'Senha atualizada com sucesso' });
  } catch (e) { next(e); }
}
