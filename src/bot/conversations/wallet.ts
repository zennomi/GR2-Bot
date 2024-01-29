import { Conversation } from "@grammyjs/conversations";
import { BotContext } from "../../types";
import { askSingleQuestion, sendMessage } from "../../utils/telegram";
import WalletModel from "../../models/wallet";
import { ethers } from "ethers";
import { editMenuOnContext } from "grammy-inline-menu";
import walletMenu from "../menus/wallet";
import config from "../../config";
import { sendEther, sendMaxAmount } from "../../services/trade";

export async function enterPrivateKey(conversation: Conversation<BotContext>, ctx: BotContext) {
    const privateKey = await askSingleQuestion({ conversation, ctx, question: "Paste private key address to import address!" });

    const wallet = new ethers.Wallet(privateKey);

    const provider = new ethers.JsonRpcProvider(config.RPC);

    const balance = await provider.getBalance(wallet.address);

    const walletTelegram = await WalletModel.create({
        address: wallet.address,
        privateKey: privateKey,
        owner: ctx.from.id,
        balance: Number(balance)
    });

    conversation.session.wallets = [...conversation.session.wallets!, walletTelegram];
    ctx.session = conversation.session;

    await editMenuOnContext(walletMenu, ctx, "/wallet/");
    //...
}

export async function editPrivateKey(conversation: Conversation<BotContext>, ctx: BotContext) {
    const privateKey = await askSingleQuestion({ conversation, ctx, question: "Paste token address to import address!" });

    const index = ctx.session.currentWallet.index;
    const currentWalletAddress = ctx.session.currentWallet.address;

    await WalletModel.findOneAndDelete({
        address: currentWalletAddress,
    });

    const wallet = new ethers.Wallet(privateKey);
    const provider = new ethers.JsonRpcProvider(config.RPC);

    const balance = await provider.getBalance(wallet.address);

    const walletTelegram = await WalletModel.create({
        address: wallet.address,
        privateKey: privateKey,
        owner: ctx.from.id,
        balance: Number(balance)
    });

    conversation.session.wallets[index] = walletTelegram!;
    ctx.session.currentWallet.address = wallet.address;
    ctx.session = conversation.session;

    await editMenuOnContext(walletMenu, ctx, "/wallet/");
    //...
}

export async function sendAlltoOne(conversation: Conversation<BotContext>, ctx: BotContext) {
    let reply = await askSingleQuestion({ conversation, ctx, question: "Enter destination address!" });
    let destination;
    let splitter;
    let amount = "0";
    let isSplit = false;

    if (reply.includes(",")) {
        splitter = reply.split(",");
        destination = splitter[0];
        amount = splitter[1];
        isSplit = true;
    }
    else {
        destination = reply;
    }

    const wallets = conversation.session.wallets;
    //console.log(wallets);

    for (let i = 0; i < wallets.length; i++) {
        if (wallets[i].address != destination) {
            if (!isSplit) {
                const result = await sendMaxAmount(wallets[i].privateKey, destination, ctx.from.id);
                if (result == null) {
                    sendMessage(ctx.chat.id, `🟣 Transaction has failed... | 💳 Sender: ${wallets[i].address}`);
                }
                else {
                    sendMessage(ctx.chat.id, `🟢 Send <a href="https://snowtrace.io/tx/${result.hash}?chainId=43113">transaction</a> succeeded | 💳 Sender: ${wallets[i].address}`, "HTML");
                }
            }
            else {
                const result = await sendEther(wallets[i].privateKey, destination, amount, ctx.from.id);
                if (result == null) {
                    sendMessage(ctx.chat.id, `🟣 Transaction has failed... | 💳 Sender: ${wallets[i].address}`);
                }
                else {
                    sendMessage(ctx.chat.id, `🟢 Send <a href="https://snowtrace.io/tx/${result.hash}?chainId=43113">transaction</a> succeeded | 💳 Sender: ${wallets[i].address}`, "HTML");
                }
            }
        }
    }
    //...
}