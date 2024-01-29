import { Conversation } from "@grammyjs/conversations";
import { BotContext } from "../../types";
import { askSingleQuestion, sendMessage } from "../../utils/telegram";
import { swapExactAVAXForTokens, swapExactTokensForAVAX } from "../../services/trade";
import { ethers } from "ethers";
import { editMenuOnContext } from "grammy-inline-menu";
import tokenMenu from "../menus/token";

export async function enterBuyAmount(conversation: Conversation<BotContext>, ctx: BotContext) {
    const amount = await askSingleQuestion({ conversation, ctx, question: "Amount?" });
    sendMessage(ctx.chat.id, "Buying...");
    const wallet = conversation.session.wallets.find(w => w.address == conversation.session.currentTokenWallet.address)!;

    sendMessage(ctx.chat.id, `🟣 Submitting buy ${amount} AVAX transaction | Sender: ${wallet.address}`);
    const result = await swapExactAVAXForTokens(conversation.session.token!.address, ethers.parseEther(amount.toString()), wallet.privateKey, conversation.session.currentTokenWallet.slippage, ctx.from.id);
    console.log(result);

    if (result == null) {
        sendMessage(ctx.chat.id, `🔴 Transaction has failed... | 💳 Sender: ${wallet.address}`);
    }
    else {
        sendMessage(ctx.chat.id, `🟢 Buy <a href="https://snowtrace.io/tx/${result.hash}?chainId=43113">transaction</a> succeeded | 💳 Sender: ${wallet.address}`, "HTML");
    }
    return true;
    //...
}

export async function enterSellAmount(conversation: Conversation<BotContext>, ctx: BotContext) {
    const amount = await askSingleQuestion({ conversation, ctx, question: "Amount?" });
    sendMessage(ctx.chat.id, "Selling...");
    const wallet = conversation.session.wallets.find(w => w.address == conversation.session.currentTokenWallet.address)!;

    sendMessage(ctx.chat.id, `🟣 Submitting sell transaction | Sender: ${wallet.address}`);


    const result = await swapExactTokensForAVAX(conversation.session.token!.address, ethers.parseEther(amount), wallet.privateKey, conversation.session.currentTokenWallet.slippage, ctx.from.id);
    console.log(result);

    if (result == null) {
        sendMessage(ctx.chat.id, `🔴 Transaction has failed... | 💳 Sender: ${wallet.address}`);
    }
    else {
        sendMessage(ctx.chat.id, `🟢 Sell <a href="https://snowtrace.io/tx/${result.hash}?chainId=43113">transaction</a> succeeded | 💳 Sender: ${wallet.address}`, "HTML");
    }
    return true;
    //...
}
export async function enterTipAmount(conversation: Conversation<BotContext>, ctx: BotContext) {
    const amount = await askSingleQuestion({ conversation, ctx, question: "Enter avax you want to tip, suggest (0.00001 -> 0.001)" });

    // ...

}

export async function enterSlippage(conversation: Conversation<BotContext>, ctx: BotContext) {
    const amount = await askSingleQuestion({ conversation, ctx, question: "Enter slippage amount" });
    ctx.session.currentTokenWallet.slippage = Number(amount) * 100;
    // ...
    await editMenuOnContext(tokenMenu, ctx, "/token/");
    return true;

}