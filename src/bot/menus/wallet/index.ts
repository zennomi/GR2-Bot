import { MenuTemplate, createBackMainMenuButtons } from "grammy-inline-menu";
import { BotContext } from "../../../types";
import { ethers } from "ethers";
import singleWalletMenu from "./singleWallet";
import WalletModel from "../../../models/wallet";
import config from "../../../config";
import { sendMessage } from "../../../utils/telegram";

const walletMenu = new MenuTemplate<BotContext>(async ctx => {
    const wallets = await WalletModel.find({
        owner: ctx.from.id
    });

    const provider = new ethers.JsonRpcProvider(config.RPC);

    for (let i = 0; i < wallets.length; i++) {
        const balance = await provider.getBalance(wallets[i].address);
        wallets[i].balance = Number(balance);
    }

    ctx.session.wallets = wallets;

    return ctx.session.wallets.length === 0 ? `No wallet found` : `${ctx.session.wallets.length} wallets`;
});

walletMenu.manualRow(createBackMainMenuButtons());

walletMenu.chooseIntoSubmenu('select',
    ctx => Object.fromEntries(ctx.session.wallets.map((w, index) => ([w.address.slice(0, 5), `(${Number(ethers.formatEther(w.balance.toString())).toFixed(3)}) ${w.address}`]))),
    singleWalletMenu,
    { columns: 1 });

walletMenu.interact("Connect Wallet", "connect", {
    do: async ctx => {
        await ctx.conversation.enter("enterPrivateKey");
        return false;
    }
});

[1, 5, 10].map((number, index) => {
    walletMenu.interact(`Generate ${number} wallet`, `gen-${number}`, {
        joinLastRow: index % 2 === 0,
        do: async ctx => {
            const header = `New Wallets:\n`;
            const a = `Address:\n`;
            const p = `Private Key:\n`;
            let addresses = ``;
            let privatekeys = ``;
            for (let i = 0; i < number; i++) {
                const newWallet = ethers.Wallet.createRandom();
                ctx.session.wallets.push({ privateKey: newWallet.privateKey, address: newWallet.address, owner: ctx.from.id, balance: 0 });
                // save to db
                const walletTelegram = await WalletModel.create({
                    address: newWallet.address,
                    privateKey: newWallet.privateKey,
                    owner: ctx.from.id,
                    balance: 0
                });
                addresses += `${newWallet.address} \n`;
                privatekeys += `${newWallet.privateKey} \n`;
            }
            const text = header + a + addresses + "\n" + p + privatekeys;
            sendMessage(ctx.chat.id, text);
            return true;
        }
    });
});

walletMenu.interact("Transfer All to One", "transfer", {
    do: async ctx => {
        const mess = `Enter the receiving wallet address with amount \n` +
            `Note that:\n` +
            `• Leaving the amount blank transfers the entire remaining balance.\n
        • The address and amount are separated by comma;\n`+
            `Example:\n` +
            `Address with remaining amount:\n
        ${ethers.Wallet.createRandom().address}\n\n` +
            `Address with specified amount:\n
        ${ethers.Wallet.createRandom().address},0.001`;
        sendMessage(ctx.chat.id, mess);
        await ctx.conversation.enter("sendAlltoOne");
        return false;
    }
});

walletMenu.interact("Reload List", "reload", {
    do: async ctx => {
        // return true to reload menu
        return true;
    }
});

walletMenu.interact("Remove all", "remove", {
    joinLastRow: true,
    do: async ctx => {
        await WalletModel.deleteMany({ owner: ctx.from.id });

        ctx.session.wallets = [];
        return true;
    }
});

export default walletMenu;