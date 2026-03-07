import { setUser, readConfig} from "./config";
import { registerCommand, runCommand, handlerLogin, CommandRegistry, handlerRegister, handlerReset, handlerUsers, handlerAgg, handlerAddFeed } from "./commands";

async function main(){
    const registry: CommandRegistry = {};
    await registerCommand(registry, "login", handlerLogin);
    await registerCommand(registry, "register", handlerRegister);
    await registerCommand(registry, "reset", handlerReset);
    await registerCommand(registry, "users", handlerUsers);
    await registerCommand(registry, "agg", handlerAgg);
    await registerCommand(registry, "addfeed", handlerAddFeed);

    const args = process.argv.slice(2);
    if (args.length === 0){
        throw new Error("no command provided");
    }

    try {
        await runCommand(registry, args[0], ...args.slice(1));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();