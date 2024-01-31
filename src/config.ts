import "dotenv/config";
import z from "zod";
import { parseEnv } from "znv";

const createConfigFromEnvironment = (environment: NodeJS.ProcessEnv) => {
    const config = parseEnv(environment, {
        NODE_ENV: z.enum(["development", "production"]),
        LOG_LEVEL: z
            .enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"])
            .default("info"),
        BOT_TOKEN: z.string(),
        BOT_ADMINS: z.array(z.number()).default([]),
        MONGO_URL: z.string(),
        RPC: z.string(),
        WETH: z.string(),
        ROUTER: z.string(),
        FACTORY: z.string(),
        MASTER_WALLET: z.string(),
        FEE: z.number()
    });

    return {
        ...config,
        isDev: process.env.NODE_ENV === "development",
        isProd: process.env.NODE_ENV === "production",
    };
};

export type Config = ReturnType<typeof createConfigFromEnvironment>;

const config = createConfigFromEnvironment(process.env);

export default config;