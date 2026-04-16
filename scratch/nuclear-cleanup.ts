import { db } from "../lib/db";

async function nuclearCleanup() {
  const suspectIP = "151.250.195.11";
  try {
    console.log(`Starting nuclear cleanup for IP: ${suspectIP}`);

    // 1. Find all rooms created by this IP
    const logs = await db.auditLog.findMany({
      where: { ipAddress: suspectIP, entityType: "ROOM", action: "CREATE" },
      select: { entityId: true }
    });

    const rIds = logs.map(l => l.entityId).filter(id => !!id) as string[];

    if (rIds.length > 0) {
      console.log(`Deleting data for ${rIds.length} suspicious rooms...`);
      await db.question.deleteMany({ where: { roomId: { in: rIds } } });
      await db.game.deleteMany({ where: { roomId: { in: rIds } } });
      await db.roomParticipant.deleteMany({ where: { roomId: { in: rIds } } });
      await db.room.deleteMany({ where: { id: { in: rIds } } });
    }

    // 2. Delete all audit logs from this IP
    const { count } = await db.auditLog.deleteMany({ where: { ipAddress: suspectIP } });
    console.log(`Deleted ${count} total audit logs from ${suspectIP}.`);

    console.log("NUCLEAR CLEANUP FINISHED SUCCESSFULLY.");
  } catch (err: any) {
    console.error("NUCLEAR CLEANUP FAILED:", err);
  } finally {
    process.exit(0);
  }
}

nuclearCleanup();
