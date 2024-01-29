import { Conversation } from "@grammyjs/conversations";
import { BotContext } from "../../types";
import { askSingleQuestion } from "../../utils/telegram";

export async function createSniper(conversation: Conversation<BotContext>, ctx: BotContext) {
    const tokenAddress = await askSingleQuestion({ conversation, ctx, question: "Paste token address to create new sniper!" })

    //...
}