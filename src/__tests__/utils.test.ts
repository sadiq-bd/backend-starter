import { describe, it, expect } from "vitest";
import { AppError } from "../lib/utils/error";
import base64 from "../lib/utils/base64";
import { formatCount } from "../lib/utils/formatters";
import AppService from "../lib/core/AppService";

// ─── AppError ───────────────────────────────────────────────

describe("AppError", () => {

	it("creates an error with default status 400", () => {
		const err = new AppError("Bad request");
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toBe("Bad request");
		expect(err.status).toBe(400);
		expect(err.headers).toEqual({});
	});

	it("accepts custom status and headers", () => {
		const err = new AppError("Unauthorized", 401, {
			"WWW-Authenticate": "Bearer",
		});
		expect(err.status).toBe(401);
		expect(err.headers["WWW-Authenticate"]).toBe("Bearer");
	});

});

// ─── Base64 ─────────────────────────────────────────────────

describe("Base64", () => {

	it("encodes and decodes a string round-trip", () => {
		const original = "hello:world";
		const encoded = base64.encode(original);

		expect(typeof encoded).toBe("string");
		expect(encoded).not.toBe(original);

		const decoded = base64.decode(encoded);
		expect(decoded).toBe(original);
	});

	it("handles unicode strings", () => {
		const original = "こんにちは世界";
		const decoded = base64.decode(base64.encode(original));
		expect(decoded).toBe(original);
	});

	it("handles empty string", () => {
		const decoded = base64.decode(base64.encode(""));
		expect(decoded).toBe("");
	});

});

// ─── formatCount ────────────────────────────────────────────

describe("formatCount", () => {

	it("returns raw number for values under 1000", () => {
		expect(formatCount(0)).toBe("0");
		expect(formatCount(1)).toBe("1");
		expect(formatCount(999)).toBe("999");
	});

	it("formats thousands as K", () => {
		expect(formatCount(1000)).toBe("1K");
		expect(formatCount(1500)).toBe("1.5K");
		expect(formatCount(10000)).toBe("10K");
	});

	it("formats millions as M", () => {
		expect(formatCount(1_000_000)).toBe("1M");
		expect(formatCount(2_500_000)).toBe("2.5M");
	});

	it("formats billions as B", () => {
		expect(formatCount(1_000_000_000)).toBe("1B");
	});

});

// ─── AppService ─────────────────────────────────────────────

describe("AppService", () => {

	it("throws when db() is called without an instance", () => {
		class TestService extends AppService {
			callDb() {
				return this.db();
			}
		}

		const svc = new TestService();
		expect(() => svc.callDb()).toThrow("Database not initialized");
	});

	it("returns the db instance when provided", () => {
		const mockDb = { query: () => {} };

		class TestService extends AppService<typeof mockDb> {
			callDb() {
				return this.db();
			}
		}

		const svc = new TestService(mockDb);
		expect(svc.callDb()).toBe(mockDb);
	});

	it("log() does not throw", () => {
		class TestService extends AppService {
			callLog() {
				this.log("test message");
			}
		}

		const svc = new TestService();
		expect(() => svc.callLog()).not.toThrow();
	});

});
