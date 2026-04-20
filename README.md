# Backend Starter

A production-ready backend starter built on **Hono** + **Cloudflare Workers**, with **Drizzle ORM** for the database layer and **Zod** for validation.

## Stack

| Layer | Technology |
|---|---|
| Runtime | [Cloudflare Workers](https://developers.cloudflare.com/workers/) |
| Framework | [Hono](https://hono.dev/) v4 |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) |
| Validation | [Zod](https://zod.dev/) |
| Testing | [Vitest](https://vitest.dev/) + [@cloudflare/vitest-pool-workers](https://developers.cloudflare.com/workers/testing/vitest-integration/) |

## Project Structure

```
src/
├── app.ts                        # App entry — middleware & route registration
├── routes/
│   └── index.ts                  # Central route registry
├── features/
│   └── test-feature/             # Example feature module
│       ├── index.ts              #   Route definitions
│       ├── config.ts             #   Feature-scoped config (DB binding)
│       ├── controller.ts         #   Request handlers
│       └── service.ts            #   Business logic (extends AppService)
├── lib/
│   ├── core/
│   │   └── AppService.ts         # Base service class (DB access, logging)
│   ├── database/
│   │   ├── index.ts              # DB factory (D1 by default)
│   │   └── d1/
│   │       ├── index.ts          #   D1 Drizzle client
│   │       └── schema.ts         #   Drizzle table schemas
│   ├── middleware/
│   │   ├── basicAuth.ts          # HTTP Basic auth (DB-backed credentials)
│   │   ├── cacheHandler.ts       # Response caching (native CF cache + fallback)
│   │   ├── errorHandler.ts       # Global error handler (HTTPException, Zod, AppError)
│   │   ├── notFoundHandler.ts    # 404 handler
│   │   └── rateLimiter.ts        # CF rate limiting
│   └── utils/
│       ├── base64.ts             # Base64 encode/decode
│       ├── cache.ts              # Cache abstraction (CF Cache API + memory fallback)
│       ├── env.ts                # Environment variable accessor
│       ├── error.ts              # AppError class
│       ├── formatters.ts         # Number formatting
│       ├── json.ts               # JSON response helpers
│       ├── remote.ts             # Client IP / connection info
│       └── sqlite.ts             # SQLite column helpers (timestamp)
├── types/
│   ├── env.ts                    # Env bindings interface
│   └── database.ts               # Database type aliases
└── __tests__/                    # Test suites
    ├── app.test.ts               # Integration — routes, 404, CORS
    ├── error-handler.test.ts     # Error handler branches
    └── utils.test.ts             # Unit — AppError, base64, formatCount, AppService
```

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js 18+)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`bun add -g wrangler`)
- A Cloudflare account with Workers & D1 enabled

### Install

```bash
bun install
```

### Development

```bash
bun run dev
```

This starts a local Workers dev server via `wrangler dev` with hot reload.

### Deploy

```bash
bun run deploy
```

Deploys to Cloudflare Workers with minification enabled.

## Database

This starter uses **Cloudflare D1** with **Drizzle ORM**.

### Schema

Edit `src/lib/database/d1/schema.ts` to define your tables using Drizzle's schema builder.

### Generate Migrations

```bash
bun run db:generate
```

### Apply Migrations

```bash
bun run db:migrate
```

## Type Generation

Regenerate Cloudflare binding types from `wrangler.jsonc`:

```bash
bun run cf-typegen
```

## Testing

Tests run in the Cloudflare Workers runtime via `@cloudflare/vitest-pool-workers`.

```bash
# Run all tests
bun run test

# Watch mode
bun run test:watch
```

### Test Structure

| File | Scope | What it covers |
|---|---|---|
| `app.test.ts` | Integration | Root route, 404 handler, CORS headers |
| `error-handler.test.ts` | Integration | HTTPException, Zod, AppError, generic 500 |
| `utils.test.ts` | Unit | `AppError`, `base64`, `formatCount`, `AppService` |

## Architecture

### Feature Modules

Each feature lives in `src/features/<name>/` with its own:

- **`index.ts`** — Hono sub-app with route definitions
- **`config.ts`** — Feature-scoped configuration (database bindings, etc.)
- **`controller.ts`** — Thin request handlers that delegate to services
- **`service.ts`** — Business logic class extending `AppService`

Features are mounted in `src/routes/index.ts`.

### Middleware Pipeline

The request pipeline applies middleware in this order:

1. **Context Storage** — Makes the Hono context available globally via `getContext()`
2. **Rate Limiter** — IP-based rate limiting using Cloudflare's built-in rate limiter
3. **CORS** — Cross-origin request handling
4. **Route-specific** — `basicAuth()`, `tokenized()`, `cacheHandler()` can be applied per-route

### AppService Base Class

All services extend `AppService<Database>` which provides:

- **`this.db()`** — Type-safe database client accessor
- **`this.log()`** — Structured logging with timestamp and class name

### Error Handling

The global error handler catches and normalizes:

| Error Type | Status | Response |
|---|---|---|
| `HTTPException` | Original status | `{ success, message }` |
| `ZodError` | 422 | `{ success, message, errors[] }` |
| `AppError` | Custom status | `{ success, message }` + custom headers |
| Generic `Error` | 500 | `{ success, message: "Internal Server Error" }` |

### JSON Response Helpers

Use `jsonSuccess()` and `jsonError()` for consistent API responses:

```ts
import { jsonSuccess, jsonError } from "@/lib/utils/json";

// { success: true, message: "Users fetched", data: [...] }
return jsonSuccess("Users fetched", { data: users });

// { success: false, message: "Not authorized" }
return jsonError("Not authorized", {}, 403);
```

## Adding a New Feature

1. Create a directory under `src/features/`:

```
src/features/my-feature/
├── index.ts
├── config.ts
├── controller.ts
└── service.ts
```

2. Define your service:

```ts
// service.ts
import AppService from "@/lib/core/AppService";
import { SqliteDB } from "@/types/database";

export class MyFeatureService extends AppService<SqliteDB> {
  async getItems() {
    return this.db().select().from(items);
  }
}
```

3. Create the controller:

```ts
// controller.ts
import { jsonSuccess } from "@/lib/utils/json";
import { Context } from "hono";
import { myFeatureConfig } from "./config";
import { MyFeatureService } from "./service";

export const MyFeatureController = {
  async list(c: Context) {
    const service = new MyFeatureService(myFeatureConfig.db());
    return jsonSuccess("Items", { data: await service.getItems() });
  },
};
```

4. Register routes in `src/routes/index.ts`:

```ts
import myFeature from "@/features/my-feature";

// inside registerRoutes()
.route('/my-feature', myFeature)
```

## License

MIT
