import { error } from "node:console";
import { readConfig, setUser } from "./config";
import { createUser, getUserByName, getUsers, resetUsersTable } from "./lib/db/queries/users";
import { fetchFeed } from "./fetchXML";

type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

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