# Gestão de Salas — API

API REST para gerenciamento de salas, em Node.js com Express 5, TypeScript e PostgreSQL.

## Stack

- Node.js 24 (executa TypeScript direto, sem etapa de build em desenvolvimento)
- Express 5
- PostgreSQL 16 via Docker Compose, acessado com `pg`
- Migrations em SQL versionado (`db/migrations`), aplicadas por `scripts/db.mjs`
- Vitest + Supertest para testes, oxlint e Prettier para qualidade

## Como rodar

Pré-requisitos: Node.js 24+ e Docker.

```bash
cp .env.example .env
# preencha DB_PASSWORD no .env (ex.: openssl rand -base64 24)
npm install
docker compose up -d db
npm run db:migrate
npm run dev
```

A API sobe em `http://localhost:3001` (porta definida por `PORT` no `.env`). `GET /health` confirma que a API está de pé e conectada ao banco.

Para subir a API também em container: `docker compose up -d --build`.

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Sobe a API com recarga automática |
| `npm run build` / `npm start` | Compila para `dist/` e executa a versão compilada |
| `npm run db:migrate` | Aplica as migrations pendentes |
| `npm run db:seed` | Executa os seeds de `db/seeds` |
| `npm run typecheck` | Verifica os tipos |
| `npm run lint` / `npm run format` | Lint e formatação |
| `npm test` | Testes unitários (`test/**/*.spec.ts`) |
| `npm run test:e2e` | Testes contra o banco (`test/**/*.e2e-spec.ts`); exigem `db:migrate` antes |

## Estrutura

```
db/
├── migrations/   # um arquivo .sql por alteração, aplicado em ordem e uma única vez
└── seeds/        # scripts .mjs de carga inicial de dados
scripts/db.mjs    # executor de migrations e seeds
src/
├── main.ts, app.ts
├── config/       # leitura das variáveis de ambiente
├── database/     # pool de conexão com o Postgres
├── common/       # middlewares compartilhados
└── modules/      # um módulo por domínio
    ├── users/    # models/, repositories/
    └── rooms/    # models/, repositories/, routes/
test/
```

## Modelo de dados

```
users 1 ──── 0..N rooms   (rooms.created_by_id → users.id)
```

### `users`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK, gerado pelo banco |
| `name` | varchar(120) | obrigatório |
| `email` | varchar(255) | obrigatório, único sem diferenciar maiúsculas |
| `password_hash` | varchar(255) | obrigatório; nunca armazena a senha em texto |
| `role` | enum `user_role` (`admin`, `user`) | padrão `user` |
| `created_at`, `updated_at` | timestamptz | preenchidos pelo banco |

### `rooms`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK, gerado pelo banco |
| `name` | varchar(100) | obrigatório, único sem diferenciar maiúsculas |
| `capacity` | integer | obrigatório, maior que zero |
| `location` | varchar(150) | opcional |
| `description` | text | opcional |
| `active` | boolean | padrão `true` |
| `created_by_id` | uuid | FK para `users`; se o usuário for removido, vira `null` e a sala é mantida |
| `created_at`, `updated_at` | timestamptz | preenchidos pelo banco |

## Migrations

Cada alteração de banco é um novo arquivo em `db/migrations`, numerado em sequência (`0003_...sql`). Um arquivo já aplicado nunca é editado. `npm run db:migrate` registra os arquivos aplicados na tabela `schema_migrations` e executa cada um dentro de uma transação. Se um arquivo falhar, nada dele fica aplicado.

## Acesso a dados

Cada módulo expõe um repositório criado a partir de uma conexão (`createRoomsRepository(pool)`, `createUsersRepository(pool)`). Recebem tanto o pool da API quanto o client que os seeds recebem, e devolvem os registros já em camelCase (`createdAt`, `createdById`).
