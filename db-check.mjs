import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ 
  connectionString: "postgresql://neondb_owner:npg_nqx2lGwStW9M@ep-shiny-haze-alsnq0fy-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require",
  max: 5 
});
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const total = await db.question.count({ where: { isActive: true } });
console.log('TOPLAM AKTİF SORU:', total);

const byMode = await db.question.groupBy({ by: ['gameMode'], where: { isActive: true }, _count: { id: true } });
console.log('\nGAME MODE:');
byMode.forEach(m => console.log(' ', m.gameMode, '->', m._count.id));

const byCategory = await db.question.groupBy({ by: ['category'], where: { isActive: true }, _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 25 });
console.log('\nKATEGORİ (top 25):');
byCategory.forEach(c => console.log(' ', JSON.stringify(c.category), '->', c._count.id));

const roomSpec = await db.question.count({ where: { isActive: true, roomId: { not: null } } });
const glob = await db.question.count({ where: { isActive: true, roomId: null } });
console.log('\nODA-ÖZEL:', roomSpec, '| GLOBAL:', glob);

const seenCount = await db.userSeenQuestion.count();
console.log('USER_SEEN_QUESTION:', seenCount);

const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const recentRounds = await db.round.findMany({ where: { game: { startedAt: { gte: sevenDaysAgo } } }, select: { questionId: true } });
const qIds = recentRounds.map(r => r.questionId).filter(Boolean);
const unique = new Set(qIds);
console.log('SON 7 GUN: round=' + qIds.length + ' benzersizSoru=' + unique.size + ' tekrar=' + (qIds.length - unique.size));

// Doğum günü veya özel kategori
const birthdayQs = await db.question.findMany({ 
  where: { isActive: true, category: { contains: 'oğum', mode: 'insensitive' } }, 
  select: { text: true, gameMode: true, category: true, roomId: true }, 
  take: 10 
});
console.log('\nDOĞUM GÜNÜ KATEGORİ SORULARI (' + birthdayQs.length + '):');
birthdayQs.forEach(q => console.log(' [' + q.gameMode + ']', q.roomId ? 'oda-özel' : 'global', '|', q.text.slice(0, 70)));

// Tekrar eden sorular (aynı game içinde)
const repeatedQuery = await db.$queryRaw`
  SELECT q.text, q.category, COUNT(*) as tekrar
  FROM "Round" r1
  JOIN "Round" r2 ON r1."questionId" = r2."questionId" AND r1."gameId" = r2."gameId" AND r1.id != r2.id
  JOIN "Question" q ON q.id = r1."questionId"
  JOIN "Game" g ON g.id = r1."gameId"
  WHERE g."startedAt" >= NOW() - INTERVAL '7 days'
  GROUP BY q.text, q.category
  LIMIT 10
`;
console.log('\nAYNI OYUN İÇİ TEKRAR EDEN SORULAR (son 7 gün):');
console.log(repeatedQuery);

await pool.end();
