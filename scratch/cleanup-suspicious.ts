import { db } from "../lib/db";

async function cleanup() {
  const SUSPICIOUS_IP = "151.250.195.11";
  try {
    const logs = await db.auditLog.findMany({
      where: { ipAddress: SUSPICIOUS_IP, entityType: "ROOM" },
      select: { entityId: true }
    });

    const roomIds = logs.map(l => l.entityId).filter(id => !!id) as string[];

    if (roomIds.length > 0) {
      console.log(`Deleting ${roomIds.length} rooms...`);
      // Delete questions first to handle relations manually if cascade is not set
      await db.question.deleteMany({ where: { roomId: { in: roomIds } } });
      await db.room.deleteMany({ where: { id: { in: roomIds } } });
    }

    // Direct delete for the offensive question ID I found earlier
    await db.question.deleteMany({ where: { id: "cmnpj5xsi000404l4mjzg8pbg" } });
    
    console.log("Cleanup done.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

cleanup();
