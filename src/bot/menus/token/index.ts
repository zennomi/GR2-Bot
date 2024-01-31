import { MenuTemplate, createBackMainMenuButtons } from "grammy-inline-menu";
import { BotContext } from "../../../types";
import { getPair, getTokenBalance, getTokenName, getTokenSymbol } from "../../../services/token";
import WalletModel from "../../../models/wallet";
import { approveMax, swapExactETHForTokens, swapExactTokensForETH } from "../../../services/trade";
import { ethers, formatUnits } from "ethers";
import { sendMessage } from "../../../utils/telegram";

const tokenMenu = new MenuTemplate<BotContext>(async (ctx) => {

    const wallets = await WalletModel.find({
        owner: ctx.from.id
    });

    ctx.session.wallets = wallets;

    if (ctx.session.wallets.length === 0) return "Please add a wallet"

    const { token } = ctx.session;

    if (!token) return "Please add token address";

    let tokenName = await getTokenName(token.address);
    let tokenSymbol = await getTokenSymbol(token.address);


    if (ctx.session.currentTokenWallet.index == -1 && ctx.session.wallets.length != 0) {
        ctx.session.currentTokenWallet.index = 0;
        ctx.session.currentTokenWallet.address = ctx.session.wallets[0].address;
    }

    let tokenBalance = await getTokenBalance(token.address, ctx.session.currentTokenWallet.address)

    const text = `${tokenName} (${tokenSymbol}) \n\n` +
        `🪙 Token Address: ${token.address} \n` +
        `Token Balance: ${formatUnits(tokenBalance, 18)} ${tokenSymbol}`

    return { text, parse_mode: "HTML", disable_web_page_preview: true };
});

tokenMenu.manualRow(createBackMainMenuButtons());

tokenMenu.interact("Add token address", "add", {
    hide: ctx => !!ctx.session.token || ctx.session.wallets.length === 0,
    do: async ctx => {
        await ctx.conversation.enter("enterTokenContract");
        return false;
    }
});

tokenMenu.interact("---Trade Mode---", "divider-0", {
    hide: ctx => !ctx.session.token,
    do: () => false
});

tokenMenu.toggle(ctx => `${ctx.session.token!.isBuyMode ? "Buy" : "Sell"} Mode 🔃`, "mode", {
    hide: ctx => !ctx.session.token,
    formatState: (ctx, text) => text,
    isSet: (ctx) => !!ctx.session.token!.isBuyMode,
    set: (ctx, newState) => { ctx.session.token!.isBuyMode = newState; return true; },
});

tokenMenu.interact("Track", "track", {
    hide: ctx => !ctx.session.token,
    joinLastRow: true,
    do: async ctx => {
        return false;
    }
});

tokenMenu.interact("Refresh", "refresh", {
    hide: ctx => !ctx.session.token,
    do: async ctx => {
        // true to refresh
        return true;
    }
});

tokenMenu.interact("Tip ETH Amount?", "tip", {
    hide: ctx => !ctx.session.token,
    joinLastRow: true,
    do: async ctx => {
        await ctx.conversation.enter("enterTipAmount");
        return false;
    }
});

tokenMenu.interact(ctx => `Slippage % (${ctx.session.currentTokenWallet.slippage / 100})`, "slippage", {
    hide: ctx => !ctx.session.token,
    joinLastRow: true,
    do: async ctx => {
        await ctx.conversation.enter("enterSlippage");
        return false;
    }
});

tokenMenu.interact("---Wallet Settings---", "divider-1", {
    hide: ctx => !ctx.session.token,
    do: () => false
});

tokenMenu.interact(ctx => `${!ctx.session.currentTokenWallet.isAllWallet ? `✅` : `❌`} ${ctx.session.currentTokenWallet.address}`, "select-address", {
    hide: ctx => !ctx.session.token || ctx.session.currentTokenWallet.index == -1,
    do: async ctx => {
        let length = ctx.session.wallets.length;
        let index = ctx.session.currentTokenWallet.index;

        index = index + 1;
        if (index == length) {
            index = 0;
        }

        ctx.session.currentTokenWallet.isAllWallet = false;

        ctx.session.currentTokenWallet.address = ctx.session.wallets[index].address;
        ctx.session.currentTokenWallet.index = index;

        return true;
    }
});

tokenMenu.interact(ctx => `${ctx.session.currentTokenWallet.isAllWallet ? `✅` : `❌`} All Wallets`, "all-address", {
    hide: ctx => !ctx.session.token || ctx.session.wallets.length == 0,
    joinLastRow: true,
    do: async ctx => {

        ctx.session.currentTokenWallet.isAllWallet = !ctx.session.currentTokenWallet.isAllWallet;

        return true;
    }
});

tokenMenu.interact("---Actions--- ", "divider-2", {
    hide: ctx => !ctx.session.token,
    do: () => false
});

[0.01, 0.1, 0.3, 0.5, 1, 2, 5, 10, 0.0001].map((amount, index) => {
    tokenMenu.interact(`🚀 Buy ${amount} ETH`, `buy-${amount}`, {
        hide: ctx => !ctx.session.token || !ctx.session.token!.isBuyMode,
        joinLastRow: index % 3 !== 0,
        do: async (ctx) => {
            // do something with amount
            if (!ctx.session.currentTokenWallet.isAllWallet) {
                sendMessage(ctx.chat.id, "Buying...");
                const wallet = ctx.session.wallets.find(w => w.address == ctx.session.currentTokenWallet.address)!;

                sendMessage(ctx.chat.id, `🟣 Submitting buy ${amount} ETH transaction | Sender: ${wallet.address}`);
                const result = await swapExactETHForTokens(ctx.session.token!.address, ethers.parseEther(amount.toString()), wallet.privateKey, ctx.session.currentTokenWallet.slippage, ctx.from.id);

                if (result == null) {
                    sendMessage(ctx.chat.id, `🔴 Transaction has failed... | 💳 Sender: ${wallet.address}`);
                }
                else {
                    sendMessage(ctx.chat.id, `🟢 Buy <a href="https://sepolia.etherscan.io/tx/${result.hash}">transaction</a> succeeded | 💳 Sender: ${wallet.address}`, "HTML");
                }
            }
            else {
                sendMessage(ctx.chat.id, "Buying multiple wallets...");
                for (let i = 0; i < ctx.session.wallets.length; i++) {

                    const wallet = ctx.session.wallets[i];

                    sendMessage(ctx.chat.id, `🟣 Submitting buy ${amount} ETH transaction | Sender: ${wallet.address}`);

                    const result = await swapExactETHForTokens(ctx.session.token!.address, ethers.parseEther(amount.toString()), wallet.privateKey, ctx.session.currentTokenWallet.slippage, ctx.from.id);

                    if (result == null) {
                        sendMessage(ctx.chat.id, `🔴 Transaction has failed... | 💳 Sender: ${wallet.address}`);
                    }
                    else {
                        sendMessage(ctx.chat.id, `🟢 Buy <a href="https://sepolia.etherscan.io/tx/${result.hash}">transaction</a> succeeded | 💳 Sender: ${wallet.address}`, 'HTML');
                    }
                }
            }
            return false;
        }
    });
});

tokenMenu.interact(`🚀 Buy X ETH`, 'buy-x', {
    hide: ctx => !ctx.session.token || !ctx.session.token!.isBuyMode,
    do: async ctx => {
        await ctx.conversation.enter("enterBuyAmount");
        return false;
    }
});

[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((amount, index) => {
    tokenMenu.interact(`🚀 Sell ${amount}%`, `sell-${amount}`, {
        hide: ctx => !ctx.session.token || ctx.session.token!.isBuyMode,
        joinLastRow: index % 3 !== 0,
        do: async (ctx) => {
            if (!ctx.session.currentTokenWallet.isAllWallet) {
                sendMessage(ctx.chat.id, "Selling...");
                const wallet = ctx.session.wallets.find(w => w.address == ctx.session.currentTokenWallet.address)!;

                const tokenAmount = await getTokenBalance(ctx.session.token!.address, ctx.session.currentTokenWallet.address);

                sendMessage(ctx.chat.id, `🟣 Submitting sell transaction | Sender: ${wallet.address}`);

                await approveMax(wallet.privateKey, ctx.session.token!.address)

                const result = await swapExactTokensForETH(ctx.session.token!.address, BigInt(tokenAmount) * BigInt(amount) / BigInt(100), wallet.privateKey, ctx.session.currentTokenWallet.slippage, ctx.from.id);

                if (result == null) {
                    sendMessage(ctx.chat.id, `🔴 Transaction has failed... | 💳 Sender: ${wallet.address}`);
                }
                else {
                    sendMessage(ctx.chat.id, `🟢 Sell <a href="https://sepolia.etherscan.io/tx/${result.hash}">transaction</a> succeeded | 💳 Sender: ${wallet.address}`, "HTML");
                }
            }
            else {
                sendMessage(ctx.chat.id, "Selling multiple wallets...");
                for (let i = 0; i < ctx.session.wallets.length; i++) {
                    const wallet = ctx.session.wallets[i];

                    const tokenAmount = await getTokenBalance(ctx.session.token!.address, wallet.address);

                    sendMessage(ctx.chat.id, `🟣 Submitting sell transaction | Sender: ${wallet.address}`);

                    await approveMax(wallet.privateKey, ctx.session.token!.address)
                    const result = await swapExactTokensForETH(ctx.session.token!.address, BigInt(tokenAmount) * BigInt(amount) / BigInt(100), wallet.privateKey, ctx.session.currentTokenWallet.slippage, ctx.from.id);

                    if (result == null) {
                        sendMessage(ctx.chat.id, `🔴 Transaction has failed... | 💳 Sender: ${wallet.address}`);
                    }
                    else {
                        sendMessage(ctx.chat.id, `🟢 Sell <a href="https://sepolia.etherscan.io/tx/${result.hash}">transaction</a> succeeded | 💳 Sender: ${wallet.address}`, "HTML");
                    }
                }
            }
            return false;
        }
    });
});

tokenMenu.interact(`🚀 Sell X Token`, 'sell-x', {
    hide: ctx => !ctx.session.token || ctx.session.token!.isBuyMode,
    joinLastRow: true,
    do: async ctx => {
        await ctx.conversation.enter("enterSellAmount");
        return false;
    }
});

tokenMenu.interact(`🗑️ Remove token`, 'remove', {
    hide: ctx => !ctx.session.token,
    do: ctx => {
        ctx.session.token = undefined
        return true
    }
})

export default tokenMenu;