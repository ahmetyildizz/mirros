import { db } from "../lib/db";

async function finalCleanup() {
  const suspectIP = "151.250.195.11";
  try {
    const logs = await db.auditLog.findMany({
      where: { ipAddress: suspectIP, entityType: "ROOM" },
      select: { entityId: true }
    });

    const ids = logs.map(l => l.entityId).filter(id => !!id) as string[];

    if (ids.length > 0) {
      for (const id of ids) {
        console.log(`Deleting data for room: ${id}`);
        // Cascade manually since I can't rely on DB cascade settings
        await db.roomParticipant.deleteMany({ where: { roomId: id } });
        await db.game.deleteMany({ where: { roomId: id } });
        await db.question.deleteMany({ where: { roomId: id } });
        await db.room.delete({ where: { id: id } });
      }
    }
    console.log("Cleanup finished.");
  } catch (err) {
    console.error("Cleanup error:", err);
  } finally {
    process.exit(0);
  }
}

finalCleanup();
