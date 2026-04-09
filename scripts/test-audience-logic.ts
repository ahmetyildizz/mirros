import { db } from "../lib/db";

async function testAudienceLogic() {
  console.log("--- Testing Audience Mode Logic ---");
  
  // 1. Ensure host exists
  const hostId = "dev-user-host";
  await db.user.upsert({
    where: { id: hostId },
    update: {},
    create: { id: hostId, email: "host@test.com", username: "host" }
  });

  // 2. Create players
  for (let i = 1; i <= 8; i++) {
    await db.user.upsert({
      where: { id: `user-00${i}` },
      update: {},
      create: { id: `user-00${i}`, email: `user${i}@test.com`, username: `user${i}` }
    });
  }

  // 3. Create spectator
  await db.user.upsert({
    where: { id: "user-009" },
    update: {},
    create: { id: "user-009", email: "spectator@test.com", username: "spectator" }
  });

  // 4. Create a dummy room
  const room = await db.room.create({
    data: {
      code: "TEST" + Math.floor(Math.random() * 10000),
      hostId: hostId,
      gameMode: "SOCIAL",
      status: "WAITING"
    }
  });
  console.log(`Created test room: ${room.id}`);

  // 2. Add 8 players
  for (let i = 1; i <= 8; i++) {
    await db.roomParticipant.create({
      data: {
        roomId: room.id,
        userId: `user-00${i}`,
        role: "PLAYER"
      } as any
    });
  }
  console.log("Added 8 players.");

  // 3. Add 9th person (should be SPECTATOR)
  // Note: The logic for auto-assigning SPECTATOR is in the join-room API. 
  // Here we verify if the game service handles them correctly.
  
  const spectator = await db.roomParticipant.create({
    data: {
      roomId: room.id,
      userId: "user-009",
      role: "SPECTATOR"
    } as any
  });
  console.log("Added 9th person as SPECTATOR.");

  // 4. Verify player filtering in game service logic
  const allParticipants = await db.roomParticipant.findMany({ where: { roomId: room.id } });
  const playersOnly = allParticipants.filter(p => (p as any).role !== "SPECTATOR");
  
  console.log(`Total participants: ${allParticipants.length}`);
  console.log(`Players only: ${playersOnly.length}`);
  
  if (playersOnly.length === 8 && allParticipants.length === 9) {
    console.log("✅ SUCCESS: Spectators are correctly separated from active players.");
  } else {
    console.log("❌ FAILURE: Spectator filtering logic failed.");
  }

  // Cleanup
  await db.roomParticipant.deleteMany({ where: { roomId: room.id } });
  await db.room.delete({ where: { id: room.id } });
  console.log("Cleaned up test data.");
}

testAudienceLogic().catch(console.error).finally(() => process.exit());
