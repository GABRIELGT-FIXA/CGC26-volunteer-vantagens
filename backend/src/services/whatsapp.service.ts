import axios from 'axios';
import { env } from '../config/env';

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('55') ? digits : `55${digits}`;
}

async function sendMessage(phone: string, message: string, attempt = 1): Promise<void> {
  if (!env.whatsapp.apiUrl) return;

  try {
    await axios.post(
      `${env.whatsapp.apiUrl}/message/sendText/${env.whatsapp.instance}`,
      { number: formatPhone(phone), text: message },
      { headers: { apikey: env.whatsapp.apiKey } }
    );
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 5000));
      return sendMessage(phone, message, attempt + 1);
    }
    console.error(`[WhatsApp] Falha ao enviar para ${phone}:`, err);
  }
}

export async function broadcast(message: string): Promise<number> {
  const { default: prisma } = await import('../config/prisma');
  const users = await prisma.user.findMany({ where: { role: 'PARTICIPANT' }, select: { phone: true } });

  await Promise.allSettled(users.map((u: { phone: string }) => sendMessage(u.phone, message)));
  return users.length;
}

export { sendMessage };
