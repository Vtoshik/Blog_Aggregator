import { eq } from "drizzle-orm";
import { db } from "..";
import { feedFollows, feeds, users } from "../schema";

export type FeedFollows = typeof feedFollows.$inferSelect;

export async function createFeedFollow(user_id: string, feed_id: string) {
    const [follow] = await db.insert(feedFollows).values(
        { user_id: user_id, feed_id: feed_id }).returning();

    const [result] =  await db.select().from(feedFollows)
        .innerJoin(users, eq(users.id, feedFollows.user_id))
        .innerJoin(feeds, eq(feeds.id, feedFollows.feed_id))
        .where(eq(feedFollows.id, follow.id));
    
    return result;
}

export async function getFeedFollowsForUser(username: string){
    const follows = await db.select({
        id: feeds.id,
        name: feeds.name,
    }).from(users)
    .innerJoin(feedFollows, eq(users.id, feedFollows.user_id))
    .innerJoin(feeds, eq(feedFollows.feed_id, feeds.id))
    .where(eq(users.name, username));

    return follows
}

export async function deleteFeedFollow(username: string, url: string) {
    const [result] = await db.select({id: feedFollows.id}).from(users)
    .innerJoin(feedFollows, eq(users.id, feedFollows.user_id))
    .innerJoin(feeds, eq(feedFollows.feed_id, feeds.id))
    .where(eq(users.name, username) && eq(feeds.url, url));
    const r = await db.delete(feedFollows).where(eq(feedFollows.id, result.id));
    return r;
}