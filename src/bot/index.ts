import { Bot, GrammyError, HttpError, session, } from "grammy";
import config from "../config";
import { BotContext, SessionData } from "../types";
import { MenuMiddleware } from "grammy-inline-menu";
import menuTemplate from "./menus";
import { conversations, createConversation } from "@grammyjs/conversations";
// conversations
import * as HomeConversation from "./conversations/home";
import * as TokenConversation from "./conversations/token";
import * as SniperConversation from "./conversations/sniper";
import * as WalletConversation from "./conversations/wallet";
import * as TransferConversation from "./conversations/transfer";

import logger from "../logger";
import handleError from "../utils/handleError";
import ReferralModel from "../models/referral";
import ReferreeModel from "../models/referree";
import { generateUniqueString } from "../utils/helpers";

// Create an instance of the `Bot` class and pass your bot token to it.
const bot = new Bot<BotContext>(config.BOT_TOKEN); // <-- put your bot token between the ""

bot.use(session({
    initial(): SessionData {
        // return empty object for now
        return {
            wallets: [],
            snipers: [],
            currentWallet: {
                address: "",
                index: -1
            },
            currentTokenWallet: {
                address: "",
                index: -1,
                isAllWallet: false,
                slippage: 500
            }
        };
    },
}));

// Install the conversations plugin.
bot.use(conversations());
bot.use(createConversation(HomeConversation.enterTokenContract));
bot.use(createConversation(TokenConversation.enterBuyAmount));
bot.use(createConversation(TokenConversation.enterSellAmount));
bot.use(createConversation(TokenConversation.enterSlippage));
bot.use(createConversation(TokenConversation.enterTipAmount));
bot.use(createConversation(WalletConversation.sendAlltoOne));
bot.use(createConversation(WalletConversation.enterPrivateKey));
bot.use(createConversation(WalletConversation.editPrivateKey));
bot.use(createConversation(SniperConversation.createSniper));
bot.use(createConversation(TransferConversation.sendToDestination));

const menuMiddleware = new MenuMiddleware('/', menuTemplate);
bot.use(menuMiddleware);

if (config.isDev) {
    bot.use((ctx, next) => {
        if (ctx.callbackQuery) {
            console.log(ctx.callbackQuery.data);
        }
        return next();
    });
    console.log(menuMiddleware.tree());
}

// Handle the /start command.
bot.command("start", async (ctx) => {
    const ref = ctx.match;

    if (ref != null) {
        const result = await ReferralModel.findOne({
            referralCode: ref
        });
        if (result && result.owner != ctx.from.id) {
            const r = await ReferreeModel.findOne({
                referrer: result.owner,
                referree: ctx.from.id
            });
            if (!r) {
                await ReferreeModel.create({
                    referrer: result.owner,
                    referree: ctx.from.id
                });
            }
        }
    }

    const b = await ReferralModel.findOne({
        owner: ctx.from.id
    });

    if (!b) {
        const refLink = generateUniqueString(10);
        await ReferralModel.create({
            owner: ctx.from.id,
            referralCode: refLink,
            feeAccumulated: 0,
            feeClaimed: 0
        });
    }


    ctx.reply("/sniper to start.");
}
);

bot.command('sniper', ctx => menuMiddleware.replyToContext(ctx));

// config
bot.api.setMyCommands([
    { command: "sniper", description: "Activate the Para Bot" }
]);

// handle error
bot.catch((err: any) => {
    const ctx = err.ctx;
    logger.error(`Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    logger.error(e);
    if (e instanceof GrammyError) {
        logger.error("Error in request:", e.description);
    } else if (e instanceof HttpError) {
        logger.error("Could not contact Telegram:", e);
    } else {
        handleError(e);
        logger.error("Unknown error:", e);
    }
});

export default bot;