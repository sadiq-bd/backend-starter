/**
 * App entry — configures middleware and mounts routes.
 * 
 * Middleware runs in registration order:
 *  1. contextStorage — stores Hono context globally so utils like
 *     _env(), jsonSuccess(), getClientIp() work without passing `c`
 *  2. rateLimiter — IP-based, config in wrangler.jsonc `ratelimits`
 *  3. cors — defaults to allow all origins (*)
 * 
 * Then routes are registered, followed by error handlers.
 */

import errorHandler from "@/lib/middleware/errorHandler";
import notFoundHandler from "@/lib/middleware/notFoundHandler";
import rateLimiter from "@/lib/middleware/rateLimiter";
import registerRoutes from "@/routes";
import { Env } from "@/types/env";
import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";
import { cors } from "hono/cors";

const app = new Hono<{ Bindings: Env }>();

app.use(contextStorage());
app.use(rateLimiter());
app.use(cors());

registerRoutes(app);

app.notFound(notFoundHandler());
app.onError(errorHandler());

export default app;
