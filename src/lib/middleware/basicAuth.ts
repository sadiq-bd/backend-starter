import database from "@/lib/database";
import { basic_auth_credentials } from "@/lib/database/d1/schema";
import base64 from "@/lib/utils/base64";
import { eq } from "drizzle-orm";
import { Context, MiddlewareHandler, Next } from "hono";
import { _env } from "../utils/env";
import { AppError } from "../utils/error";


export default (): MiddlewareHandler => (async (c: Context, next: Next) => {

	const [scheme, encoded] = c.req.header('Authorization')?.split(' ') ?? [];

	if (
		scheme?.toLowerCase() === 'basic'
		&& encoded?.length > 8
	) {
		const [user, pass] = base64.decode(encoded).split(':');

		const [cred] = await database(_env(c)).select()
			.from(basic_auth_credentials).where(eq(basic_auth_credentials.user, user)).limit(1);

		if (cred && cred.password === pass) {
			return await next();
		}
	}

	throw new AppError('Unauthorized', 401, {
		'WWW-Authenticate': 'Basic'
	});

});
