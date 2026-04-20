// Uses CF Cache API in production, in-memory Map as fallback for local dev.
// Keys are normalized (sorted query params) so param order doesn't affect cache hits.

type CacheEntry = {
	response: Response;
};

const memoryCache = new Map<string, CacheEntry>();

const getNormalizedUrl = (req: Request) => {
	const url = new URL(req.url);
	url.searchParams.sort();
	return url.toString();
};

const getKey = (req: Request) => {
	return req.method + ":" + getNormalizedUrl(req);
};

export const cache = () => {
	const hasNativeCache = typeof caches !== "undefined" && caches.default;

	if (hasNativeCache) {
		const native = caches.default;

		return {
			put: async (req: Request | URL, res: Response, ttl?: number) => {
				if (req instanceof URL) {
					req = new Request(req.toString());
				}
				if (req.method !== "GET") return;

				const cloned = res.clone();

				if (ttl) {
					cloned.headers.delete("cache-control");
					cloned.headers.set("cache-control", `public, max-age=${ttl}`);
				}

				await native.put(req, cloned);
			},

			match: (req: Request | URL) => native.match(req),

			delete: (req: Request | URL) => native.delete(req)
		};
	}

	return {
		put: async (req: Request | URL, res: Response, ttl?: number) => {
			if (req instanceof URL) {
				req = new Request(req.toString());
			}
			if (req.method !== "GET") return;

			const key = getKey(req);
			const cloned = res.clone();

			if (ttl) {
				cloned.headers.delete("cache-control");
				cloned.headers.set("cache-control", `public, max-age=${ttl}`);
			}

			memoryCache.set(key, {
				response: cloned
			});
		},

		match: async (req: Request | URL) => {
			if (req instanceof URL) {
				req = new Request(req.toString());
			}
			const key = getKey(req);
			const entry = memoryCache.get(key);
			if (!entry) return undefined;
			return entry.response.clone();
		},

		delete: async (req: Request | URL) => {
			if (req instanceof URL) {
				req = new Request(req.toString());
			}
			const key = getKey(req);
			return memoryCache.delete(key);
		}
	};
};
