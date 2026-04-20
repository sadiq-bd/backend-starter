/**
 * Base service class that all feature services extend.
 * 
 * Provides:
 *  - Type-safe database access via `this.db()`
 *  - Structured logging via `this.log()`
 * 
 * Usage:
 *  class UserService extends AppService<SqliteDB> { ... }
 *  const svc = new UserService(DB.default());
 */
export default class AppService<Database = unknown> {

    constructor(
        // Optional — services without DB access can omit this
        protected dbInstance?: Database
    ) {}

    /**
     * Returns the injected database client.
     * Throws if the service was instantiated without one,
     * preventing silent undefined access.
     */
    protected db(): Database {
        if (!this.dbInstance) {
            throw new Error(`[${this.constructor.name}] Database not initialized`);
        }
        return this.dbInstance;
    }

    /** Logs with ISO timestamp and the subclass name for traceability. */
    protected log(...args: any[]) {
        console.log(`[${new Date().toISOString()}][${this.constructor.name}]`, ...args);
    }

}
