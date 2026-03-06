import { error } from "node:console";
import { setUser } from "./config";

type CommandHandler = (cmdName: string, ...args: string[]) => void;

export function handlerLogin(cmdName: string, ...args: string[]){
    if (args.length == 0){
        throw new Error("login command expects username argument");
    }
    setUser(args[0]);
    console.log(`User ${args[0]} was succesfully set`);
}

export type CommandRegistry = {
    [key: string]: CommandHandler;
};

export function registerCommand(registry: CommandRegistry, cmdName: string, handler: CommandHandler){
    registry[cmdName] = handler;
}

export function runCommand(registry: CommandRegistry, cmdName: string, ...args: string[]){
    const handler = registry[cmdName];
    if (!handler) {
        throw new Error(`unknown command: ${cmdName}`);
    }
    handler(cmdName, ...args);
}