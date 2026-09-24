#!/usr/bin/env node
const { execSync } = require('child_process');

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

run('npx prisma migrate deploy');

if (process.env.SEED_ON_BOOT === 'true') {
  run('npx tsx prisma/seed.ts');
}

run('node dist/main');
