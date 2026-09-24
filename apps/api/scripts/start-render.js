#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function resolveMain() {
  const candidates = [
    path.join(__dirname, '..', 'dist', 'main.js'),
    path.join(__dirname, '..', 'dist', 'src', 'main.js'),
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) return file;
  }
  const distDir = path.join(__dirname, '..', 'dist');
  console.error('dist/main.js não encontrado. Conteúdo de dist/:');
  if (fs.existsSync(distDir)) {
    console.error(fs.readdirSync(distDir, { recursive: true }));
  } else {
    console.error('(pasta dist inexistente — o build pode não ter gerado artefatos)');
  }
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não definida. Configure o Postgres no Render ou Neon.');
  process.exit(1);
}

run('npx prisma migrate deploy');

if (process.env.SEED_ON_BOOT === 'true') {
  run('npx tsx prisma/seed.ts', { optional: true });
}

const mainFile = resolveMain();
run(`node "${mainFile}"`);
