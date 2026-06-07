import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: 'Dados inválidos',
      details: err.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
    });
    return;
  }

  if (err instanceof Error) {
    const status = (err as { status?: number }).status ?? 500;
    res.status(status).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: 'Erro interno do servidor' });
}
