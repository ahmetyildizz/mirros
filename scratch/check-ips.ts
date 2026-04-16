
import "dotenv/config";
import { db } from "../lib/db";

async function main() {
  console.log("=== Security Audit: IP Distribution ===");
  try {
    const stats = await db.auditLog.groupBy({
      by: ['ipAddress'],
      _count: { id: true },
      where: { 
        action: 'JOIN_ROOM',
      },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });
    
    console.log('Top IPs by Room Joins:', JSON.stringify(stats, null, 2));

    const roomStats = await db.auditLog.groupBy({
      by: ['ipAddress'],
      _count: { id: true },
      where: { 
        action: 'CREATE',
        entityType: 'ROOM'
      },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    });
    console.log('Top IPs by Room Creation:', JSON.stringify(roomStats, null, 2));

    const totalRounds = await db.round.count();
    console.log(`Total Rounds: ${totalRounds}`);
    
    const suspectIP = "151.250.195.11";
    const suspectLogsCount = await db.auditLog.count({ where: { ipAddress: suspectIP } });
    console.log(`Remaining logs for suspect IP ${suspectIP}: ${suspectLogsCount}`);

  } catch (error) {
    console.error("Audit failed:", error);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
