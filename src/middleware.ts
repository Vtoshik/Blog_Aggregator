import { readConfig } from "./config";
import { getUserByName, User } from "./lib/db/queries/users";
import { type CommandHandler } from "./commands"

type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;


type middlewareLoggedInType = (handler: UserCommandHandler) => CommandHandler;

export const middlewareLoggedIn: middlewareLoggedInType = (handler) => {
  return async (cmdName: string, ...args: string[]) => {
    const name = readConfig().currentUserName;

    if (!name) {
      throw new Error(`No user logged in`);
    }

    const user = await getUserByName(name);
    if(!user) {
      throw new Error(`User: ${name} doesn't exist in db`);
    }

    await handler(cmdName, user, ...args);
  }
}