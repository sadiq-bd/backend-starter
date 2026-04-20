import { drizzle } from "drizzle-orm/d1";

export const createD1Client = (d1: D1Database, bookmark?: string) => {
    // withSession(bookmark) enables read-after-write consistency
    return drizzle(d1.withSession(bookmark) as any);
};
