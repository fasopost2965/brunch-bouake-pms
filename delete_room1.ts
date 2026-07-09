import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  await prisma.folioLine.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.folio.deleteMany();
  await prisma.deposit.deleteMany();
  await prisma.reservationStatusHistory.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.maintenanceIssue.deleteMany();
  await prisma.housekeepingTask.deleteMany();
  await prisma.room.delete({ where: { id: 1 } });
  const rt = await prisma.roomType.findFirst({ where: { name: 'Standard Double' } });
  if (rt) await prisma.roomType.delete({ where: { id: rt.id } });
  console.log('Deleted Room 1 and its relations.');
}
run();
