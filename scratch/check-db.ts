import { db } from "../lib/db";

async function check() {
  const count = await db.question.count();
  console.log("Total Questions:", count);
  const activeCount = await db.question.count({ where: { isActive: true } });
  console.log("Active Questions:", activeCount);
  
  const rooms = await db.room.findMany({ 
    orderBy: { createdAt: "desc" }, 
    take: 5,
    include: { _count: { select: { participants: true } } }
  });
  console.log("Latest Rooms:", JSON.stringify(rooms, null, 2));
}

check().catch(console.error);
