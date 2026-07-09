import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const rooms = await prisma.room.findMany({ include: { roomType: true }, orderBy: { number: 'asc' } });
  console.log('\n--- INVENTAIRE FINAL ---');
  for (const r of rooms) {
    console.log(`- Room: ${r.number} | Type: ${r.roomType.name} | CreatedAt: ${r.createdAt.toISOString()}`);
  }
}
run();
