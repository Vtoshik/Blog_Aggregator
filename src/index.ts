import { setUser, readConfig} from "./config";
import { registerCommand, runCommand, handlerLogin, CommandRegistry } from "./commands";

function main(){
    const registry: CommandRegistry = {};
    registerCommand(registry, "login", handlerLogin);

    const args = process.argv.slice(2);
    if (args.length === 0){
        throw new Error("no command provided");
    }
    runCommand(registry, args[0], ...args.slice(1));
}

main();