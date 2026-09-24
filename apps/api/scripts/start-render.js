#!/usr/bin/env node
const { execSync } = require('child_process');

function run(cmd, { optional = false } = {}) {
  console.log(`> ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', env: process.env });
  } catch (err) {
    if (optional) {
      console.error(`Aviso: comando opcional falhou: ${cmd}`);
      console.error(err?.message ?? err);
      return;
    }
    throw err;
  }
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não definida. Configure o Postgres no Render ou Neon.');
  process.exit(1);
}

run('npx prisma migrate deploy');

if (process.env.SEED_ON_BOOT === 'true') {
  run('npx tsx prisma/seed.ts', { optional: true });
}

run('node dist/main');
