import { Hono } from "hono";
import { TestFeatureController } from "./controller";

export default new Hono()
	.get('', TestFeatureController.test);