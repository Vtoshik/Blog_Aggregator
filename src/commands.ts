import { error } from "node:console";
import { setUser } from "./config";
import { createUser, getUserByName } from "./lib/db/queries/users";

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
    console.log(`User ${args[0]} was succesfully registered`);
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