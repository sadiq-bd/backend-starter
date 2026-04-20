import { sql } from "drizzle-orm";
import { integer } from "drizzle-orm/sqlite-core";

// Pass `() => new Date()` as onUpdate to auto-refresh on writes
export const timestamp_ms = (onUpdate?: () => any) => {
    const ts = integer({ mode: 'timestamp_ms' })
        .default(sql`(strftime('%s','now') * 1000)`)
        .$defaultFn(() => new Date())
        .notNull();

    if (onUpdate) {
        return ts.$onUpdateFn(onUpdate);
    }

    return ts;
};
