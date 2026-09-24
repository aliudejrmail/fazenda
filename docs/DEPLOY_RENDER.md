# Deploy no Render (demonstração)

Guia para publicar API + Web + PostgreSQL no [Render](https://render.com).

## O que será criado

| Serviço | Nome sugerido | Plano |
|---------|---------------|-------|
| PostgreSQL | `fazenda-db` | Free* ou Starter |
| Web Service (API NestJS) | `fazenda-api` | Free |
| Web Service (Next.js) | `fazenda-web` | Free |

\* O Postgres **free** do Render pode não estar disponível na sua conta. Alternativa gratuita: [Neon](https://neon.tech) (cole a `DATABASE_URL` na API).

## 1. Subir o código para o GitHub

No PowerShell, na pasta do projeto:

```powershell
cd D:\projetos_web\fazenda
git init
git add .
git commit -m "Deploy ready for Render demo"
# Crie um repositório vazio no GitHub e então:
git remote add origin https://github.com/SEU_USUARIO/fazenda.git
git branch -M main
git push -u origin main
```

## 2. Criar o Blueprint no Render

1. Acesse https://dashboard.render.com
2. **New** → **Blueprint**
3. Conecte o repositório `fazenda`
4. Confirme o arquivo `render.yaml`
5. Aplique o Blueprint

## 3. Variáveis obrigatórias (após o 1º deploy)

As URLs finais ficam assim (ajuste se o nome do serviço for outro):

- API: `https://fazenda-api.onrender.com`
- Web: `https://fazenda-web.onrender.com`

### No serviço `fazenda-api`

| Variável | Valor |
|----------|-------|
| `CORS_ORIGIN` | `https://fazenda-web.onrender.com` |
| `DATABASE_URL` | já vem do banco (ou cole a URL do Neon) |
| `JWT_SECRET` | gerado pelo Blueprint |
| `JWT_REFRESH_SECRET` | gerado pelo Blueprint |
| `SEED_ON_BOOT` | `true` |

Depois de salvar, clique em **Manual Deploy** → **Deploy latest commit**.

### No serviço `fazenda-web`

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://fazenda-api.onrender.com/api/v1` |

**Importante:** `NEXT_PUBLIC_*` entra no **build**. Após definir, faça um novo deploy da web.

## 4. Deploy manual (sem Blueprint)

### Banco

**Option A — Render Postgres:** New → PostgreSQL → copie a Internal/External Database URL.

**Option B — Neon (grátis):** crie projeto → copie a connection string.

### API

- **Root Directory:** `apps/api`
- **Build Command:** `npm install --include=dev && npx prisma generate && npm run build`
- **Start Command:** `npm run start:render`
- **Health Check Path:** `/api/v1/health`

### Web

- **Root Directory:** `apps/web`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`
- Env: `NEXT_PUBLIC_API_URL=https://SUA-API.onrender.com/api/v1`

## 5. Testar a demo

1. Abra `https://fazenda-web.onrender.com`
2. Login:
   - E-mail: `admin@fazenda.local`
   - Senha: `admin123`
3. API docs: `https://fazenda-api.onrender.com/api/docs`
4. Health: `https://fazenda-api.onrender.com/api/v1/health`

## Limitações do plano Free (demo)

- Serviços **dormem** após ~15 min sem acesso (1º request pode levar 30–60 s)
- Bom para apresentação; não use como produção real
- Se o banco free não existir, use Neon ou o plano Starter do Render

## Problemas comuns

| Sintoma | Solução |
|---------|---------|
| Web chama `localhost:3001` | `NEXT_PUBLIC_API_URL` não foi setada **antes** do build — redeploy a web |
| CORS bloqueado | `CORS_ORIGIN` deve ser exatamente a URL da web (https, sem barra no final) |
| Login inválido | Aguarde o start com seed (`SEED_ON_BOOT=true`) ou rode `npm run prisma:seed` no Shell do Render |
| Build da API falha no Prisma | Confirme que `prisma/migrations` está no Git |
