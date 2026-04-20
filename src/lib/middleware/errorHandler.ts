import { AppError } from '@/lib/utils/error';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ContentfulStatusCode } from 'hono/utils/http-status';
import { z } from 'zod';


// Priority: HTTPException → ZodError (422) → AppError → generic 500
export default () => (err: Error, c: Context) => {

    if (err instanceof HTTPException && err.status !== 500) {
        return c.json({
            success: false,
            message: err.message,
        }, err.status);
    }

    if (err instanceof z.ZodError) {
        return c.json({
            success: false,
            message: "Validation failed",
            errors: err.issues.map(issue => ({
                field: issue.path.join('.'),
                message: issue.message,
            })),
        }, 422);
    }

    if (err instanceof AppError) {
        return c.json({
            success: false,
            message: err.message,
        }, err.status as ContentfulStatusCode, err.headers);
    }

    console.error(`[Error]`, err instanceof Error ? err.stack : err);
    return c.json({
        success: false,
        message: "Internal Server Error"
    }, 500);

}
