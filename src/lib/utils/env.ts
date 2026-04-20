import { Env } from '@/types/env';
import { Context } from 'hono';
import { getContext } from 'hono/context-storage';

export const _env = (c?: Context): Env => {
	if (c?.env) return c.env;

	try {
		return getContext()?.env as Env;
	} catch {
		throw new Error('_env() called outside of request context');
	}
}
