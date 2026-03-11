import { registerCommand, runCommand, handlerLogin, CommandRegistry, handlerRegister, handlerReset, handlerUsers, handlerAgg, handlerAddFeed, handlerFeeds, handlerFollow, handlerFollowing, handlerUnFollow, handlerBrowse } from "./commands";
import { middlewareLoggedIn } from "./middleware";

async function main(){
    const registry: CommandRegistry = {};
    await registerCommand(registry, "login", handlerLogin);
    await registerCommand(registry, "register", handlerRegister);
    await registerCommand(registry, "reset", handlerReset);
    await registerCommand(registry, "users", handlerUsers);
    await registerCommand(registry, "agg", handlerAgg);
    await registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
    await registerCommand(registry, "feeds", handlerFeeds);
    await registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
    await registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
    await registerCommand(registry, "unfollow", middlewareLoggedIn(handlerUnFollow));
    await registerCommand(registry, "browse", middlewareLoggedIn(handlerBrowse));

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