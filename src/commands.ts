import { readConfig, setUser } from "./config";
import { createUser, getUserByName, getUsers, resetUsersTable, User } from "./lib/db/queries/users";
import { fetchFeed } from "./fetchXML";
import { createFeed, Feed, getAllFeeds, getFeedByUrl, getNextFeedToFetch, markFeedFetched } from "./lib/db/queries/feeds";
import { createFeedFollow, deleteFeedFollow, getFeedFollowsForUser } from "./lib/db/queries/feed_follows";
import { createPost, getPostsForUser } from "./lib/db/queries/posts";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

export async function handlerLogin(cmdName: string, ...args: string[]){
    if (args.length == 0){
        throw new Error("login command expects username argument");
    }
    const existing = await getUserByName(args[0]);
    if (!existing){
        throw new Error(`User ${args[0]} not yet registered`)
    }
    setUser(args[0]);
    console.log(`User ${args[0]} was succesfully set`);
}

export async function handlerRegister(cmdName: string, ...args:string[]){
    if (args.length == 0){
        throw new Error("register command expects username argument");
    }
    const name = args[0];
    const existing = await getUserByName(name);
    if (existing) {
        throw new Error(`user ${name} already exists`);
    }

    const user = await createUser(name);
    setUser(args[0]);
    console.log(`User ${args[0]} was succesfully registered`);
}

export async function handlerReset(cmdName: string, ...args: string[]){
    await resetUsersTable();
    console.log(`All users where successfully deleted`);
}

export async function handlerUsers(cmdName:string, ...args: string[]) {
    const users = await getUsers();
    const current_user = readConfig().currentUserName;
    for (const user of users) {
        if (user.name === current_user){
            console.log(`* ${user.name} (current)`);
        } else {
            console.log(`* ${user.name}`);
        }
    }
}

export async function handlerAgg(cmdName: string, ...args: string[]){
    if (args.length !== 1) {
        throw new Error("agg command expects a time_between_reqs argument (e.g. 1s, 1m, 1h)");
    }

    const timeBetweenReqs = parseDuration(args[0]);
    console.log(`Collecting feeds every ${args[0]}...`);

    scrapeFeeds().catch(console.error);

    const interval = setInterval(() => {
        scrapeFeeds().catch(console.error);
    }, timeBetweenReqs);

    await new Promise<void>((resolve) => {
        process.on("SIGINT", () => {
            console.log("Shutting down feed aggregator...");
            clearInterval(interval);
            resolve();
        });
    });
}

function parseDuration(duration: string): number {
    const regex = /^(\d+)(ms|s|m|h)$/;
    const match = duration.match(regex);
    if (!match) throw new Error(`invalid duration: ${duration}. Use formats like 1s, 1m, 1h, 500ms`);
    const value = parseInt(match[1]);
    switch (match[2]) {
        case "ms": return value;
        case "s": return value * 1000;
        case "m": return value * 1000 * 60;
        case "h": return value * 1000 * 60 * 60;
        default: throw new Error(`unknown duration unit: ${match[2]}`);
    }
}

export async function handlerAddFeed(cmdName: string, user: User, ...args: string[]){
    if (args.length == 0 || args.length < 2){
        throw new Error("addfeed command expects name and url arguments");
    }

    const feed = await createFeed(args[0], args[1], user.id);
    await createFeedFollow(user.id, feed.id);
    printFeed(user, feed);
}

export async function handlerFeeds(cmdName: string, ...args: string[]){
    if (args.length > 0) {
        throw new Error(`feeds command doesn't require arguments`);
    }

    const feeds = await getAllFeeds();
    for (const {feeds: feed, users: user} of feeds){
        console.log(`Username: ${user.name}`);
        console.log(`Feed name: ${feed.name}`);
        console.log(`Feed url: ${feed.url}`);
    }
}

export async function handlerFollow(cmdName: string, user: User, ...args: string[]){
    if (args.length !== 1){
        throw new Error(`follow commands requires only one url argument`);
    }

    const feed = await getFeedByUrl(args[0]);
    const follow = await createFeedFollow(user.id, feed.id);
    if (follow) {
        console.log(`User: ${user.name} followed ${feed.name} successfully `);
    }
}

export async function handlerFollowing(cmdName: string, user: User, ...args: string[]){
    if (args.length > 0) {
        throw new Error(`following command doesn't require arguments`);
    }

    const follows = await getFeedFollowsForUser(user.name);
    if (follows) {
        for (const follow of follows){
            console.log(`* ${follow.name}`);
        }
    }   
}

export async function handlerUnFollow(cmdName: string, user: User, ...args: string[]){
    if (args.length < 1) {
        throw new Error(`unfollow command requires url argument`);
    }

    const result = await deleteFeedFollow(user.name, args[0]);
    if (result) {
        console.log(`User: ${user.name} successfully unfollowed url: ${args[0]}`)
    }
}

export async function scrapeFeeds(){
    const next = await getNextFeedToFetch();
    await markFeedFetched(next.id);
    const result = await fetchFeed(next.url);
    console.log(`Found ${result.channel.item.length} posts in ${next.name}`);
    let saved = 0;
    for (const item of result.channel.item){
        const publishedAt = parseDate(item.pubDate);
        const post = await createPost(item.title, item.link, next.id, item.description, publishedAt ?? undefined);
        if (post) saved++;
    }
    console.log(`  Saved ${saved} new posts from ${next.name}`);
}

function parseDate(raw: string | number | undefined): Date | null {
    if (!raw) return null;
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
    return null;
}

export async function handlerBrowse(cmdName: string, user: User, ...args: string[]){
    const limit = args.length > 0 ? parseInt(args[0]) : 2;
    if (isNaN(limit) || limit < 1) {
        throw new Error("browse limit must be a positive integer");
    }
    const userPosts = await getPostsForUser(user.name, limit);
    if (userPosts.length === 0) {
        console.log("No posts found. Try running `agg` first to fetch feeds.");
        return;
    }
    for (const post of userPosts) {
        console.log(`--- ${post.title}`);
        console.log(`    URL: ${post.url}`);
        if (post.published_at) {
            console.log(`    Published: ${post.published_at.toDateString()}`);
        }
        if (post.description) {
            const preview = post.description.replace(/<[^>]+>/g, "").slice(0, 200);
            console.log(`    ${preview}`);
        }
        console.log();
    }
}


function printFeed(user: User, feed: Feed){
    console.log(`Username: ${user.name}`);
    console.log(`Feed name: ${feed.name}`);
    console.log(`Feed url: ${feed.url}`);
}

export type CommandRegistry = {
    [key: string]: CommandHandler;
};

export async function registerCommand(registry: CommandRegistry, cmdName: string, handler: CommandHandler){
    registry[cmdName] = handler;
}

export async function runCommand(registry: CommandRegistry, cmdName: string, ...args: string[]){
    const handler = registry[cmdName];
    if (!handler) {
        throw new Error(`unknown command: ${cmdName}`);
    }
    await handler(cmdName, ...args);
}