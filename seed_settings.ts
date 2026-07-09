import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  await prisma.systemSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      data: { name: 'Brunch Bouaké', currency: 'FCFA' },
      touristTaxRate: 1000
    }
  });
  console.log('SystemSettings seeded.');
}
run();
