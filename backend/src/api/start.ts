import { app } from './server';
import { PrismaClient } from '@prisma/client';

const PORT = parseInt(process.env.PORT || '3001', 10);

const server = app.listen(PORT, () => {
  console.log(`Backend API server listening on http://localhost:${PORT}`);
});

// Production graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Gracefully stopping backend server...`);
  server.close(async () => {
    try {
      const prisma = new PrismaClient();
      await prisma.$disconnect();
    } catch {}
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
