import { desc, eq } from "drizzle-orm";
import { db } from "..";
import { feedFollows, posts, users } from "../schema";

export type Post = typeof posts.$inferSelect;

export async function createPost(
    title: string,
    url: string,
    feed_id: string,
    description?: string,
    published_at?: Date,
) {
    const [result] = await db.insert(posts).values({
        title,
        url,
        feed_id,
        description: description ?? null,
        published_at: published_at ?? null,
    }).onConflictDoNothing().returning();
    return result;
}

export async function getPostsForUser(username: string, limit: number) {
    const result = await db
        .select({
            id: posts.id,
            title: posts.title,
            url: posts.url,
            description: posts.description,
            published_at: posts.published_at,
            feed_id: posts.feed_id,
            created_at: posts.created_at,
            updated_at: posts.updated_at,
        })
        .from(posts)
        .innerJoin(feedFollows, eq(feedFollows.feed_id, posts.feed_id))
        .innerJoin(users, eq(users.id, feedFollows.user_id))
        .where(eq(users.name, username))
        .orderBy(desc(posts.published_at))
        .limit(limit);
    return result;
}
