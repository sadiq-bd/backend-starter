// Uses global context storage — no need to pass `c` explicitly
import { getContext as ctx } from "hono/context-storage";
import { ContentfulStatusCode } from "hono/utils/http-status";

type JsonExtra = Record<string, any>;
type JsonHeaders = Record<string, string>;

export const json = (
    success: boolean,
    message: string,
    extra: JsonExtra = {},
    status: ContentfulStatusCode = 200,
    headers: JsonHeaders = {},
    pretty: boolean = false
) => {
    const body = { success, message, ...extra };

    return pretty
        ? ctx().text(JSON.stringify(body, null, 4), status, {
            ...headers,
            "Content-Type": "application/json",
        })
        : ctx().json(body, status, headers);
};

export const jsonSuccess = (message: string, extra?: JsonExtra, status?: ContentfulStatusCode, headers: JsonHeaders = {}, pretty?: boolean) =>
    json(true, message, extra, status, headers, pretty);

export const jsonError = (message: string, extra?: JsonExtra, status?: ContentfulStatusCode, headers: JsonHeaders = {}, pretty?: boolean) =>
    json(false, message, extra, status, headers, pretty);
