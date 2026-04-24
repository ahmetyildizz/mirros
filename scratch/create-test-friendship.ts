import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const u1 = await prisma.user.upsert({
    where: { username: "TesterA" },
    update: {},
    create: { email: "testerA@mirros.com", username: "TesterA", provider: "GUEST" }
  });

  const u2 = await prisma.user.upsert({
    where: { username: "TesterB" },
    update: {},
    create: { email: "testerB@mirros.com", username: "TesterB", provider: "GUEST" }
  });

  await prisma.friendship.upsert({
    where: { requesterId_receiverId: { requesterId: u1.id, receiverId: u2.id } },
    update: { status: "ACCEPTED" },
    create: { requesterId: u1.id, receiverId: u2.id, status: "ACCEPTED" }
  });

  console.log("Friendship created between TesterA and TesterB");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
