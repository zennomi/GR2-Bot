import mongoose from "mongoose";
import config from "./config";

import bot from "./bot";
import logger from "./logger";
import sniperListener from "./sniper";

mongoose.connect(config.MONGO_URL).then(() => {
    logger.info("Connected to MongoDB")
    bot.start()
    sniperListener()
})