import { _env } from "@/lib/utils/env";
import { Env } from "@/types/env";
import { createD1Client } from "./d1";

export const DB = {
	default: (env?: Env, bookmark?: string) => DB.d1(env, bookmark),
	d1: (env?: Env, bookmark?: string) => createD1Client(env?.D1 ?? _env().D1, bookmark)
};

export default DB.default;
