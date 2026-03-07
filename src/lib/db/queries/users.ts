import { eq } from "drizzle-orm";
import { db } from "..";
import { users } from "../schema";

export type User = typeof users.$inferSelect;

export async function createUser(name:string) {
    const [result] = await db.insert(users).values({ name: name }).returning();
    return result;
}

export async function getUserByName(name:string){
    const [result] = await db.select().from(users).where(eq(users.name, name));
    return result;
}

export async function resetUsersTable(){
    await db.delete(users);
}

export async function getUsers(){
    const result = await db.select().from(users);
    return result;
}