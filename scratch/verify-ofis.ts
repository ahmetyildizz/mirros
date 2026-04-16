
import 'dotenv/config';
import { db } from '../lib/db';

async function main() {
  const count = await db.question.count({
    where: { category: 'Ofis Kaosu' }
  });
  console.log('Ofis Kaosu questions count:', count);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
