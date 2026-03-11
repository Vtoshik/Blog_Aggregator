import { eq, sql } from "drizzle-orm";
import { db } from "..";
import { feeds, users } from "../schema";

export type Feed = typeof feeds.$inferSelect;

export async function createFeed(name: string, url: string, user_id: string) {
    const [result] = await db.insert(feeds).values({ name: name, 
        url: url, user_id: user_id }).returning();
    return result;
}

export async function getAllFeeds() {
    const result = await db.select().from(feeds)
        .innerJoin(users, eq(feeds.user_id, users.id));
    return result;
}

export async function getFeedByUrl(url: string){
    const [result] = await db.select().from(feeds).where(eq(feeds.url, url));
    return result;
}

export async function getNextFeedToFetch() {
    const [result] = await db.select().from(feeds)
        .orderBy(sql`${feeds.last_fetched_at} ASC NULLS FIRST`)
        .limit(1);
    return result;
}

export async function markFeedFetched(id: string){
    await db.update(feeds)
    .set({ last_fetched_at: new Date(), updated_at: new Date( )})
    .where(eq(feeds.id, id));
}