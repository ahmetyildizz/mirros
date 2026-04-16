import { db } from "../lib/db";

async function findRoomInfo() {
  try {
    const roomId = "cmnpj341l000004l48z5g9cky";
    console.log(`Searching for Room: ${roomId}`);

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: {
        host: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    if (!room) {
      console.log("Room not found.");
      return;
    }

    console.log("--- ROOM INFO ---");
    console.log(JSON.stringify(room, null, 2));

    const audit = await db.auditLog.findFirst({
      where: {
        entityType: "ROOM",
        entityId: roomId,
        action: "CREATE"
      },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    console.log("\n--- ROOM CREATE AUDIT ---");
    console.log(JSON.stringify(audit, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

findRoomInfo();
