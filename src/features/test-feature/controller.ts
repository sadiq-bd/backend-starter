import { jsonSuccess } from "@/lib/utils/json";
import { Context } from "hono";
import { testFeatureConfig } from "./config";
import { TestFeatureService } from "./service";


export const TestFeatureController = {

	async test(c: Context) {
		const service = new TestFeatureService(testFeatureConfig.db());
		return jsonSuccess('Test feature', { data: await service.test() }, 200, {}, true);
	}

};
