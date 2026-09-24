# Gestão Pecuária

Sistema web multi-fazenda para gestão de cria, recria e confinamento, com API REST pronta para aplicativo mobile futuro.

## Stack

- **API:** NestJS + Prisma + PostgreSQL
- **Web:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Auth:** JWT (access + refresh)
- **Multi-fazenda:** header `X-Farm-Id`

## Pré-requisitos

- Node.js 20+
- Docker Desktop (PostgreSQL)

## Subir o ambiente local

### 1. Banco de dados

```powershell
cd D:\projetos_web\fazenda
docker compose up -d
```

Postgres fica em `localhost:5433` (porta 5433 para não conflitar com outros Postgres locais).

### 2. API

```powershell
cd D:\projetos_web\fazenda\apps\api
Copy-Item .env.example .env   # se ainda não existir
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

- API: http://localhost:3001/api/v1
- OpenAPI: http://localhost:3001/api/docs

### 3. Web

```powershell
cd D:\projetos_web\fazenda\apps\web
# .env.local já contém NEXT_PUBLIC_API_URL
npm run dev
```

- App: http://localhost:3000

## Credenciais de demonstração (seed)

| Campo | Valor |
|-------|-------|
| E-mail | `admin@fazenda.local` |
| Senha | `admin123` |
| Fazenda | Fazenda Modelo |

## Deploy no Render (demo)

Passo a passo completo: [docs/DEPLOY_RENDER.md](docs/DEPLOY_RENDER.md)

Resumo rápido:

1. Envie o projeto para o GitHub
2. No Render: **New → Blueprint** e use o `render.yaml`
3. Configure:
   - API: `CORS_ORIGIN=https://fazenda-web.onrender.com`
   - Web: `NEXT_PUBLIC_API_URL=https://fazenda-api.onrender.com/api/v1`
4. Redeploy e acesse a URL da web

## Módulos

- Dashboard (cabeças, partos, mortalidade %, resultado do mês)
- Fazendas (multi-fazenda)
- Rebanho por lote (cria / recria / confinamento)
- Reprodutivo (partos, mortalidade, descarte, reposição de plantel)
- Movimentações e pesagens
- Financeiro (despesas por centro de custo, receitas, resultado)
- Vacinas e calendário sanitário
- Almoxarifado
- Frota (combustível e manutenção de trator/veículos)
- Funcionários e folha

## API para o app mobile

Use os mesmos endpoints em `/api/v1`:

1. `POST /auth/login` → `accessToken` + `refreshToken`
2. `GET /farms` → escolher fazenda
3. Enviar `Authorization: Bearer <token>` e `X-Farm-Id: <farmId>` em todas as rotas de negócio

Documentação interativa: `/api/docs`

## Nomenclatura do setor

O sistema usa termos técnicos: matrizes paridas, bezerro/bezerra, descarte reprodutivo, reposição de plantel, custos da propriedade vs confinamento, mortalidade (%), resultado do período.
