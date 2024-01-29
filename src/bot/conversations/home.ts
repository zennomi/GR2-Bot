// conversations for home menu

import { Conversation } from "@grammyjs/conversations";
import { BotContext } from "../../types";
import { askSingleQuestion } from "../../utils/telegram";
import { editMenuOnContext } from "grammy-inline-menu";
import tokenMenu from "../menus/token";

export async function enterTokenContract(conversation: Conversation<BotContext>, ctx: BotContext) {
    const tokenAddress = await askSingleQuestion({ conversation, ctx, question: "Paste token contract to begin buy & sell ↔️" })

    conversation.session.token = { address: tokenAddress, isBuyMode: true }

    // required
    ctx.session = conversation.session

    // update current menu
    await editMenuOnContext(tokenMenu, ctx, "/token/")
}