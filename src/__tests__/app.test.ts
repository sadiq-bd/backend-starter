import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { contextStorage } from "hono/context-storage";
import errorHandler from "../lib/middleware/errorHandler";
import notFoundHandler from "../lib/middleware/notFoundHandler";

/**
 * Test app that mirrors the real app's structure but skips
 * Cloudflare-specific middleware (rate limiter) that requires Workers bindings.
 */
function createTestApp() {
	const app = new Hono();
	app.use(contextStorage());
	app.use(cors());

	app.get("/", (c) => c.text("Hello, world!"));
	app.get("/json", (c) => c.json({ success: true, message: "OK" }));

	app.notFound(notFoundHandler());
	app.onError(errorHandler());

	return app;
}

describe("App → Root", () => {
	const app = createTestApp();

	it("GET / returns hello world", async () => {
		const res = await app.request("/");
		expect(res.status).toBe(200);

		const text = await res.text();
		expect(text).toBe("Hello, world!");
	});

	it("GET /json returns structured JSON", async () => {
		const res = await app.request("/json");
		expect(res.status).toBe(200);

		const body = await res.json();
		expect(body).toEqual({ success: true, message: "OK" });
	});

	it("GET /nonexistent returns 404", async () => {
		const res = await app.request("/this-does-not-exist");
		expect(res.status).toBe(404);

		const body = await res.json();
		expect(body).toHaveProperty("message", "Not found");
	});

});

describe("App → CORS", () => {
	const app = createTestApp();

	it("responds with CORS headers on preflight", async () => {
		const res = await app.request("/", {
			method: "OPTIONS",
			headers: {
				Origin: "https://example.com",
				"Access-Control-Request-Method": "GET",
			},
		});

		expect(res.headers.get("access-control-allow-origin")).toBeTruthy();
	});

	it("includes CORS headers on normal GET", async () => {
		const res = await app.request("/", {
			headers: { Origin: "https://example.com" },
		});

		expect(res.headers.get("access-control-allow-origin")).toBeTruthy();
	});

	it("defaults to wildcard origin when no Origin header", async () => {
		const res = await app.request("/");
		expect(res.headers.get("access-control-allow-origin")).toBe("*");
	});

});
