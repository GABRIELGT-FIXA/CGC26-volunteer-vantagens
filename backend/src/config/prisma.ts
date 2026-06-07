import { PrismaClient } from '@prisma/client';

// Single shared instance to avoid multiple connections
const prisma = new PrismaClient();

export default prisma;
