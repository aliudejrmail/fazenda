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
| `SEED_ON_BOOT` | `true` só no 1º deploy da demo (cria o usuário admin); depois volte para `false` |
| `ALLOW_PUBLIC_REGISTER` | `false` (padrão) |
| `COOKIE_SAMESITE` | *(vazio = `lax`)* — só use `none` se a web chamar a API direto de outro domínio |

Depois de salvar, clique em **Manual Deploy** → **Deploy latest commit**.

### No serviço `fazenda-web`

| Variável | Valor |
|----------|-------|
| `API_PROXY_TARGET` | `https://fazenda-api.onrender.com` |
| `NEXT_PUBLIC_API_URL` | *(deixe vazio)* |

A sessão usa cookies `httpOnly`. A web chama `/api/v1/*` na **própria origem** e o Next
faz o proxy para `API_PROXY_TARGET`, mantendo os cookies como first-party (sem CORS/SameSite=None).

**Importante:** `API_PROXY_TARGET` é lido no **build** (rewrites). Após alterar, faça um novo deploy da web.

## 4. Deploy manual (sem Blueprint)

### Banco

**Option A — Render Postgres:** New → PostgreSQL → copie a Internal/External Database URL.

**Option B — Neon (grátis):** crie projeto → copie a connection string.

### API

- **Root Directory:** *(deixe vazio)*
- **Build Command:** `npm run build:api`
- **Start Command:** `npm run start:api`
- **Health Check Path:** `/api/v1/health`

### Web

- **Root Directory:** *(deixe vazio)*
- **Build Command:** `npm run build`   (ou `npm run build:web`)
- **Start Command:** `npm run start`   (ou `npm run start:web`)
- Env: `API_PROXY_TARGET=https://SUA-API.onrender.com`

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
| Web chama `localhost:3001` / 502 no `/api/v1` | `API_PROXY_TARGET` não foi setada **antes** do build — defina e redeploy a web |
| Login OK mas volta para /login | Cookie bloqueado: confirme que a web usa o proxy (`NEXT_PUBLIC_API_URL` vazio) ou, em modo cross-domain, `COOKIE_SAMESITE=none` + HTTPS |
| CORS bloqueado | `CORS_ORIGIN` deve ser exatamente a URL da web (https, sem barra no final). Se a API retornar 502, o browser também mostra erro de CORS — veja os logs da API |
| API 502 Bad Gateway | Quase sempre `DATABASE_URL` ausente/inválida ou migrate falhou. Use Neon se o Postgres free do Render não existir. Confira **Logs** do serviço `fazenda-api` |
| Login inválido | Aguarde o start com seed (`SEED_ON_BOOT=true`) ou rode `npm run prisma:seed` no Shell do Render |
| Build da API falha no Prisma | Confirme que `prisma/migrations` está no Git |
