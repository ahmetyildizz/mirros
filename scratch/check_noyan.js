const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({
    where: { username: "Noyan" }
  });
  console.log("User Noyan:", user);
  process.exit(0);
}

check();
