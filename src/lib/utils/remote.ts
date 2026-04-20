import { getConnInfo } from "hono/cloudflare-workers";
import { getContext as ctx } from "hono/context-storage";

export const getRemoteCtx = () => getConnInfo(ctx()).remote;

export const getRemoteAddress = () => getRemoteCtx().address;

export const getRemoteAddressType = () => getRemoteCtx().addressType;

export const getRemotePort = () => getRemoteCtx().port;

// Fallback chain: connection info → cf-connecting-ip → x-real-ip → x-forwarded-for
export const getClientIp = () => {
    const c = ctx();
    return (
        getRemoteAddress() ||
        c.req.header('cf-connecting-ip') ||
        c.req.header('x-real-ip') ||
        c.req.header('x-forwarded-for')?.split(',')[0].trim()
    );
};
