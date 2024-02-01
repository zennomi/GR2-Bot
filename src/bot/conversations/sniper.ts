import { Conversation } from "@grammyjs/conversations";
import { BotContext } from "../../types";
import { askSingleQuestion } from "../../utils/telegram";
import SniperModel from "../../models/sniper";
import { approveMax } from "../../services/trade";
import { editMenuOnContext } from "grammy-inline-menu";
import sniperMenu from "../menus/sniper";
import WalletModel from "../../models/wallet";

export async function createSniper(conversation: Conversation<BotContext>, ctx: BotContext) {
    if (conversation.session.wallets.length === 0) {
        conversation.session.wallets = await WalletModel.find({ owner: ctx.from.id })
    }

    if (conversation.session.wallets.length === 0) {
        ctx.reply("Please create a wallet")
        return;
    }

    const tokenAddress = await askSingleQuestion({ conversation, ctx, question: "Paste token address to create new sniper!" })

    const existed = await SniperModel.findOne({ owner: ctx.from.id, token: tokenAddress })

    if (!!existed) {
        await ctx.reply("Sniper existed")
        return;
    }

    const ethAmount = await askSingleQuestion({ conversation, ctx, question: "ETH amount you want to buy!" })

    const sniper = await SniperModel.create({
        token: tokenAddress,
        owner: ctx.from.id,
        ethAmount: ethAmount
    })

    const mainWallet = conversation.session.wallets[0]

    await approveMax(mainWallet.privateKey, tokenAddress)

    conversation.session.snipers = [...conversation.session.snipers, sniper]

    ctx.session = conversation.session

    editMenuOnContext(sniperMenu, ctx, '/sniper/')
}