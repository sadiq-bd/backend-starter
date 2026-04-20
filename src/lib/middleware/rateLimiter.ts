// Rate limit config (limit/period) is in wrangler.jsonc under `ratelimits`

import { Context, MiddlewareHandler, Next } from "hono";
import { _env } from "../utils/env";
import { AppError } from "../utils/error";
import { getClientIp } from "../utils/remote";

export default (): MiddlewareHandler => (async (c: Context, next: Next) => {

	const ipAddress = getClientIp() || "";

	const { success } = await _env(c).DEFAULT_RATE_LIMITER.limit({ key: ipAddress });

	if (!success) {
		throw new AppError('Too many requests, please try again later.', 429);
	}

	await next();

});
