require('dotenv').config();
const { PrismaNeonHTTP } = require('@prisma/adapter-neon');
const { PrismaClient } = require('@prisma/client');

(async () => {
  try {
    const adapter = new PrismaNeonHTTP({ connectionString: process.env.DATABASE_URL });
    const prisma = new PrismaClient({ adapter });
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('Result:', result);
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
