import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  console.log('--- Son 10 Denetim Günlüğü (AuditLog) ---');
  const logs = await db.auditLog.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });

  if (logs.length === 0) {
    console.log('Henüz denetim günlüğü bulunamadı.');
  } else {
    console.log(JSON.stringify(logs, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
