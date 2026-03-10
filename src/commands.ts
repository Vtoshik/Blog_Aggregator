import { readConfig, setUser } from "./config";
import { createUser, getUserByName, getUsers, resetUsersTable, User } from "./lib/db/queries/users";
import { fetchFeed } from "./fetchXML";
import { createFeed, Feed, getAllFeeds, getFeedByUrl } from "./lib/db/queries/feeds";
import { createFeedFollow, deleteFeedFollow, getFeedFollowsForUser } from "./lib/db/queries/feed_follows";

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
    let url = "https://www.wagslane.dev/index.xml";
    const result = await fetchFeed(url);
    console.log(`Feed: ${result.channel.title}`);
    console.log(`Link: ${result.channel.link}`);
    console.log(`Description: ${result.channel.description}`);
    console.log(`Items: ${result.channel.item.length}`);
    for (const item of result.channel.item) {
        console.log(`  - ${item.title}`);
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