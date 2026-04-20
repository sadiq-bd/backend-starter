import AppService from "@/lib/core/AppService";
import { SqliteDB } from "@/types/database";


export class TestFeatureService extends AppService<SqliteDB> {

	async test() {
		// Use this.db() for Drizzle queries, e.g.:
		// return this.db().select().from(users).where(eq(users.id, 1));
		return { message: 'Test feature' };
	}

}
