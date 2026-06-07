import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const env = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  timezone: process.env.TIMEZONE ?? 'America/Sao_Paulo',
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',

  jwt: {
    secret: required('JWT_SECRET'),
    refreshSecret: required('JWT_REFRESH_SECRET'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  whatsapp: {
    apiUrl: process.env.EVOLUTION_API_URL ?? '',
    apiKey: process.env.EVOLUTION_API_KEY ?? '',
    instance: process.env.EVOLUTION_INSTANCE ?? '',
  },

  admin: {
    phone: process.env.ADMIN_PHONE ?? '',
    password: process.env.ADMIN_PASSWORD ?? '',
  },
};
