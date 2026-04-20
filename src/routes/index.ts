import testFeature from "@/features/test-feature";
import { Hono } from "hono";

export default function registerRoutes(app: Hono<any>) {

	return app

		.get('/', (c) => c.text('Hello, world!'))

		.route('/test', testFeature)

}
