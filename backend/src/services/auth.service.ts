import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';
import { env } from '../config/env';
import { SECURITY_QUESTIONS } from '../config/constants';

const SALT_ROUNDS = 12;

export async function checkPhone(phone: string) {
  const user = await prisma.user.findUnique({ where: { phone } });
  return { exists: !!user };
}

export async function register(data: {
  fullName: string;
  age: number;
  phone: string;
  password: string;
  profilePhoto?: string;
  securityQuestion: string;
  securityAnswer: string;
  teamIds: string[];
}) {
  if (!SECURITY_QUESTIONS.includes(data.securityQuestion)) {
    throw Object.assign(new Error('Pergunta de segurança inválida'), { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { phone: data.phone } });
  if (existing) throw Object.assign(new Error('Telefone já cadastrado'), { status: 409 });

  const [hashedPassword, hashedAnswer] = await Promise.all([
    bcrypt.hash(data.password, SALT_ROUNDS),
    bcrypt.hash(data.securityAnswer.toLowerCase().trim(), SALT_ROUNDS),
  ]);

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      age: data.age,
      phone: data.phone,
      password: hashedPassword,
      profilePhoto: data.profilePhoto,
      securityQuestion: data.securityQuestion,
      securityAnswer: hashedAnswer,
      teams: data.teamIds.length > 0 ? {
        create: data.teamIds.map((teamId) => ({ teamId })),
      } : undefined,
    },
    include: { teams: { include: { team: true } } },
  });

  return sanitizeUser(user);
}

export async function login(phone: string, password: string) {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw Object.assign(new Error('Credenciais inválidas'), { status: 401 });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw Object.assign(new Error('Credenciais inválidas'), { status: 401 });

  return generateTokens(user.id, user.role);
}

export async function refreshToken(token: string) {
  let payload: { userId: string; role: string };
  try {
    payload = jwt.verify(token, env.jwt.refreshSecret) as typeof payload;
  } catch {
    throw Object.assign(new Error('Refresh token inválido'), { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw Object.assign(new Error('Usuário não encontrado'), { status: 401 });

  return generateTokens(user.id, user.role);
}

export async function getSecurityQuestion(phone: string) {
  const user = await prisma.user.findUnique({ where: { phone }, select: { securityQuestion: true } });
  if (!user) throw Object.assign(new Error('Telefone não encontrado'), { status: 404 });
  return { securityQuestion: user.securityQuestion };
}

export async function verifySecurityAnswer(phone: string, answer: string) {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw Object.assign(new Error('Telefone não encontrado'), { status: 404 });

  const valid = await bcrypt.compare(answer.toLowerCase().trim(), user.securityAnswer);
  if (!valid) throw Object.assign(new Error('Resposta incorreta'), { status: 401 });

  const resetToken = jwt.sign({ userId: user.id, purpose: 'reset' }, env.jwt.secret, { expiresIn: '15m' });
  return { resetToken };
}

export async function resetPassword(resetToken: string, newPassword: string) {
  let payload: { userId: string; purpose: string };
  try {
    payload = jwt.verify(resetToken, env.jwt.secret) as typeof payload;
  } catch {
    throw Object.assign(new Error('Token de reset inválido ou expirado'), { status: 401 });
  }

  if (payload.purpose !== 'reset') {
    throw Object.assign(new Error('Token inválido'), { status: 401 });
  }

  const hashed = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: payload.userId }, data: { password: hashed } });
}

function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign({ userId, role }, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
  const refreshToken = jwt.sign({ userId, role }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
  return { accessToken, refreshToken };
}

function sanitizeUser(user: { id: string; fullName: string; phone: string; role: string; profilePhoto: string | null }) {
  return { id: user.id, fullName: user.fullName, phone: user.phone, role: user.role, profilePhoto: user.profilePhoto };
}
