import fs from "fs";
import os from "os";
import path from "path";

type Config = {
    dbUrl: string;
    currentUserName?: string;
}

export function readConfig(): Config{
    const obj = JSON.parse(fs.readFileSync(getConfigFilePath(), "utf8"));
    return validateConfig(obj);
}

export function setUser(username: string): void{
    const cfg = readConfig();
    cfg.currentUserName = username;
    writeConfig(cfg);
}

function getConfigFilePath(): string {
    return path.join(os.homedir(), ".gatorconfig.json");
}

function writeConfig(cfg: Config): void {
    const data = {
        db_url: cfg.dbUrl,
        current_user_name: cfg.currentUserName,
    };
    fs.writeFileSync(getConfigFilePath(), JSON.stringify(data, null, 2));
}

function validateConfig(rawConfig: any): Config {
    if (!rawConfig.db_url){
        throw new Error("missing db_url in config");
    }

    return {
        dbUrl: rawConfig.db_url,
        currentUserName: rawConfig.current_user_name,
    };
}