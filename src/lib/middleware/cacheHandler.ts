import { waitUntil } from "cloudflare:workers";
import { Context, MiddlewareHandler, Next } from "hono";
import { cache } from "../utils/cache";

export default (
	ttl: number = 60,
	onCachedServe?: (c: Context) => Promise<any>
): MiddlewareHandler => {
	return async (c: Context, next: Next) => {
		if (c.req.method !== "GET") {
			return next();
		}

		const req = c.req.raw;
		const cached = await cache().match(req);

		if (cached) {
			if (onCachedServe) {
				waitUntil(onCachedServe(c));
			}

			return revalidateClientHeaders(
                toMutableResponse(cached)
            );
		}

		await next();

		const resp = c.res;

		if (resp.status === 200) {
			waitUntil(cache().put(req, resp, ttl));
		}

		return revalidateClientHeaders(resp);
	};
};

// Force browsers to always revalidate — server-side cache handles freshness
const revalidateClientHeaders = (resp: Response) => {
	resp.headers.delete("cache-control");
	resp.headers.set("cache-control", "max-age=0, must-revalidate");
	return resp;
};

// CF Cache API returns immutable responses, need a mutable copy to modify headers
const toMutableResponse = (resp: Response) => {
	return new Response(
		resp.body,
		{
			status: resp.status,
			statusText: resp.statusText,
			headers: resp.headers
		}
	);
};
