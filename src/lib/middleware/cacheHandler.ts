import { waitUntil } from "cloudflare:workers";
import { Context, MiddlewareHandler, Next } from "hono";
import { cache } from "../utils/cache";

const CACHE_STALE_AT_HEADER = "x-cache-stale-at";
const CDN_CACHE_TTL = 60 * 60 * 24 * 30;

export default (
	ttl: number = 60,
	onCachedServe?: (c: Context) => Promise<any>
): MiddlewareHandler => {
	return async (c: Context, next: Next) => {
		if (c.req.method !== "GET") {
			return next();
		}

		c.req.raw = toCacheRequest(c.req.raw);

		const req = c.req.raw;
		const cached = await cache().match(req);

		if (cached) {
			const stale = isStale(cached);

			if (stale) {
				waitUntil(revalidateCache(c, next, req, ttl));
			}

			if (onCachedServe && !stale) {
				waitUntil(onCachedServe(c).catch(console.error));
			}

			return revalidateClientHeaders(
				toClientResponse(cached)
			);

		}

		return serveAndCache(c, next, req, ttl);

	};
};

const serveAndCache = async (
	c: Context,
	next: Next,
	req: Request,
	ttl: number
) => {
	await next();

	const resp = c.res;

	if (resp.status === 200) {
		let client: Response;
		let cacheable: Response;

		try {
			[client, cacheable] = splitResponse(resp, ttl);
		} catch (err) {
			console.error(err);
			return revalidateClientHeaders(resp);
		}

		waitUntil(cache().put(req, cacheable, CDN_CACHE_TTL).catch(console.error));

		c.res = client;

		return revalidateClientHeaders(c.res);
	}

	return revalidateClientHeaders(resp);
};

const revalidateCache = async (
	c: Context,
	next: Next,
	req: Request,
	ttl: number
) => {
	await new Promise<void>((resolve) => setTimeout(resolve, 0));

	c.finalized = false;

	try {
		await next();

		if (c.res.status === 200) {
			await cache().put(req, toCacheResponse(c.res, ttl), CDN_CACHE_TTL);
		}
	} catch (err) {
		console.error(err);
	} finally {
		c.finalized = true;
	}
};

const toCacheResponse = (resp: Response, ttl: number) => {
	const headers = new Headers(resp.headers);

	headers.set(CACHE_STALE_AT_HEADER, String(Date.now() + ttl * 1000));

	return new Response(resp.body, {
		status: resp.status,
		statusText: resp.statusText,
		headers
	});
};

const splitResponse = (resp: Response, ttl: number) => {
	const now = Date.now();
	const headers = new Headers(resp.headers);
	const clientHeaders = new Headers(headers);
	const cacheHeaders = new Headers(headers);

	cacheHeaders.set(CACHE_STALE_AT_HEADER, String(now + ttl * 1000));
	clientHeaders.delete(CACHE_STALE_AT_HEADER);

	if (!resp.body) {
		return [
			new Response(null, {
				status: resp.status,
				statusText: resp.statusText,
				headers: clientHeaders
			}),
			new Response(null, {
				status: resp.status,
				statusText: resp.statusText,
				headers: cacheHeaders
			})
		] as const;
	}

	const [clientBody, cacheBody] = resp.body.tee();

	return [
		new Response(clientBody, {
			status: resp.status,
			statusText: resp.statusText,
			headers: clientHeaders
		}),
		new Response(cacheBody, {
			status: resp.status,
			statusText: resp.statusText,
			headers: cacheHeaders
		})
	] as const;
};

const revalidateClientHeaders = (resp: Response) => {
	resp.headers.delete(CACHE_STALE_AT_HEADER);
	resp.headers.delete("cache-control");
	resp.headers.delete("last-modified");

	resp.headers.set("cache-control", "max-age=0, must-revalidate");
	return resp;
};

const toClientResponse = (resp: Response) => {
	const cloned = toMutableResponse(resp);

	cloned.headers.delete(CACHE_STALE_AT_HEADER);

	return cloned;
};

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

const toCacheRequest = (req: Request) => {
	const headers = new Headers(req.headers);

	headers.delete(CACHE_STALE_AT_HEADER);

	return new Request(req, {
		headers
	});
};

const isStale = (resp: Response) => {
	const staleAt = Number(resp.headers.get(CACHE_STALE_AT_HEADER));
	return !staleAt || Date.now() >= staleAt;
};
