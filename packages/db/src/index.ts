import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Named exports (optional)
export * from '@prisma/client';

// Default export
export default prisma;
