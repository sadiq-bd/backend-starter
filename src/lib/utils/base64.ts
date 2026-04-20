import { decodeBase64, encodeBase64 } from "hono/utils/encode";

export default {
	encode: (str: string) => encodeBase64(new TextEncoder().encode(str).buffer),
	decode: (str: string) => new TextDecoder().decode(decodeBase64(str)),
};
