import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  console.log('--- Son 10 Denetim Günlüğü (AuditLog) ---');
  try {
    const logs = await db.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { username: true } } }
    });

    if (logs.length === 0) {
      console.log('Veritabanında henüz bir kayıt bulunamadı.');
    } else {
      logs.forEach((log, index) => {
        console.log(`[${index + 1}] Eylem: ${log.action}, Hedef: ${log.entityType}, Resource: ${log.resource}, Kullanıcı: ${log.user?.username || 'Sistem'}, Tarih: ${log.createdAt}`);
      });
    }
  } catch (error) {
    console.error('Sorgu hatası:', error.message);
  } finally {
    await db.$disconnect();
  }
}

main();
