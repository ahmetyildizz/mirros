const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.question.count();
  console.log('--- Questions count: ' + count + ' ---');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
