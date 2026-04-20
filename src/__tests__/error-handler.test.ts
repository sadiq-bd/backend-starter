import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { AppError } from "../lib/utils/error";
import errorHandler from "../lib/middleware/errorHandler";

/**
 * Isolated test app that only uses the error handler.
 * Each test throws a different error type to verify the handler's branching.
 */
function createTestApp() {
	const app = new Hono();

	app.get("/http-exception", () => {
		throw new HTTPException(403, { message: "Forbidden resource" });
	});

	app.get("/zod-error", () => {
		const schema = z.object({
			email: z.string().email(),
			age: z.number().min(18),
		});
		schema.parse({ email: "bad", age: 5 });
	});

	app.get("/app-error", () => {
		throw new AppError("Custom app error", 422);
	});

	app.get("/app-error-headers", () => {
		throw new AppError("Unauthorized", 401, {
			"WWW-Authenticate": "Bearer",
		});
	});

	app.get("/generic-error", () => {
		throw new Error("Something unexpected");
	});

	app.onError(errorHandler());

	return app;
}

describe("Error Handler", () => {
	const app = createTestApp();

	it("handles HTTPException with correct status & message", async () => {
		const res = await app.request("/http-exception");
		expect(res.status).toBe(403);

		const body = await res.json();
		expect(body.success).toBe(false);
		expect(body.message).toBe("Forbidden resource");
	});

	it("handles Zod validation errors with 422 and field details", async () => {
		const res = await app.request("/zod-error");
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.success).toBe(false);
		expect(body.message).toBe("Validation failed");
		expect(body.errors).toBeInstanceOf(Array);
		expect(body.errors.length).toBeGreaterThan(0);
		expect(body.errors[0]).toHaveProperty("field");
		expect(body.errors[0]).toHaveProperty("message");
	});

	it("handles AppError with custom status", async () => {
		const res = await app.request("/app-error");
		expect(res.status).toBe(422);

		const body = await res.json();
		expect(body.success).toBe(false);
		expect(body.message).toBe("Custom app error");
	});

	it("handles AppError with custom headers", async () => {
		const res = await app.request("/app-error-headers");
		expect(res.status).toBe(401);
		expect(res.headers.get("WWW-Authenticate")).toBe("Bearer");

		const body = await res.json();
		expect(body.success).toBe(false);
	});

	it("handles generic errors as 500 Internal Server Error", async () => {
		const res = await app.request("/generic-error");
		expect(res.status).toBe(500);

		const body = await res.json();
		expect(body.success).toBe(false);
		expect(body.message).toBe("Internal Server Error");
	});

});
