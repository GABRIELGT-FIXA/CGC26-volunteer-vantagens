import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { env } from '../config/env';
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_SIZE_MB } from '../config/constants';

// Garante que a pasta de uploads exista (evita ENOENT em deploys novos)
fs.mkdirSync(env.uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.'));
    }
  },
});
