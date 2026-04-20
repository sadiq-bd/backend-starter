import { DB } from "@/lib/database";

export const testFeatureConfig = {
	db: () => DB.default(),
};
