import { setUser, readConfig} from "./config";
import { registerCommand, runCommand, handlerLogin, CommandRegistry, handlerRegister } from "./commands";

async function main(){
    const registry: CommandRegistry = {};
    await registerCommand(registry, "login", handlerLogin);
    await registerCommand(registry, "register", handlerRegister)

    const args = process.argv.slice(2);
    if (args.length === 0){
        throw new Error("no command provided");
    }
    await runCommand(registry, args[0], ...args.slice(1));
    process.exit(0);
}

main();