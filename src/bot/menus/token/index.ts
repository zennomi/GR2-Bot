import { MenuTemplate, createBackMainMenuButtons } from "grammy-inline-menu";
import { BotContext } from "../../../types";
import { getPair, getTokenBalance, getTokenName, getTokenSymbol } from "../../../services/token";
import WalletModel from "../../../models/wallet";
import { swapExactAVAXForTokens, swapExactTokensForAVAX } from "../../../services/trade";
import { ethers } from "ethers";
import { sendMessage } from "../../../utils/telegram";
import config from "../../../config";

const tokenMenu = new MenuTemplate<BotContext>(async (ctx) => {
    const { token } = ctx.session;


    if (!token) return "Please add token address";

    let tokenName = await getTokenName(token.address);
    let tokenSymbol = await getTokenSymbol(token.address);

    let pair = await getPair(token.address, config.WAVAX);

    const text = `${tokenName} (${tokenSymbol}) \n\n` +
        `🪙 CA: ${token.address} \n` +
        `🎯 Exchange: TraderJoe \n` +
        `💡 MarketCap: ??? \n` +
        `💧 Liquidity: ??? \n` +
        `💰 Token Price: ??? \n\n` +
        `<a href="https://www.dextools.io/app/en/avalanche/pair-explorer/${pair}">DexTools</a> | <a href="https://snowtrace.io/address/${pair}#code-43113">Pair</a>`;



    const wallets = await WalletModel.find({
        owner: ctx.from.id
    });

    ctx.session.wallets = wallets;

    if (ctx.session.currentTokenWallet.index == -1 && ctx.session.wallets.length != 0) {
        ctx.session.currentTokenWallet.index = 0;
        ctx.session.currentTokenWallet.address = ctx.session.wallets[0].address;
    }

    return { text, parse_mode: "HTML", disable_web_page_preview: true };
});

tokenMenu.manualRow(createBackMainMenuButtons());

tokenMenu.interact("Add token address", "add", {
    hide: ctx => !!ctx.session.token,
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

tokenMenu.interact("Tip AVAX Amount?", "tip", {
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
    tokenMenu.interact(`🚀 Buy ${amount} AVAX`, `buy-${amount}`, {
        hide: ctx => !ctx.session.token || !ctx.session.token!.isBuyMode,
        joinLastRow: index % 3 !== 0,
        do: async (ctx) => {
            // do something with amount
            if (!ctx.session.currentTokenWallet.isAllWallet) {
                sendMessage(ctx.chat.id, "Buying...");
                const wallet = ctx.session.wallets.find(w => w.address == ctx.session.currentTokenWallet.address)!;

                sendMessage(ctx.chat.id, `🟣 Submitting buy ${amount} AVAX transaction | Sender: ${wallet.address}`);
                const result = await swapExactAVAXForTokens(ctx.session.token!.address, ethers.parseEther(amount.toString()), wallet.privateKey, ctx.session.currentTokenWallet.slippage, ctx.from.id);
                console.log(result);

                if (result == null) {
                    sendMessage(ctx.chat.id, `🔴 Transaction has failed... | 💳 Sender: ${wallet.address}`);
                }
                else {
                    sendMessage(ctx.chat.id, `🟢 Buy <a href="https://snowtrace.io/tx/${result.hash}?chainId=43113">transaction</a> succeeded | 💳 Sender: ${wallet.address}`, "HTML");
                }
            }
            else {
                sendMessage(ctx.chat.id, "Buying multiple wallets...");
                for (let i = 0; i < ctx.session.wallets.length; i++) {

                    const wallet = ctx.session.wallets[i];

                    sendMessage(ctx.chat.id, `🟣 Submitting buy ${amount} AVAX transaction | Sender: ${wallet.address}`);
                    const result = await swapExactAVAXForTokens(ctx.session.token!.address, ethers.parseEther(amount.toString()), wallet.privateKey, ctx.session.currentTokenWallet.slippage, ctx.from.id);
                    console.log(result);

                    if (result == null) {
                        sendMessage(ctx.chat.id, `🔴 Transaction has failed... | 💳 Sender: ${wallet.address}`);
                    }
                    else {
                        sendMessage(ctx.chat.id, `🟢 Buy <a href="https://snowtrace.io/tx/${result.hash}?chainId=43113">transaction</a> succeeded | 💳 Sender: ${wallet.address}`, 'HTML');
                    }
                }
            }
            return false;
        }
    });
});

tokenMenu.interact(`🚀 Buy X AVAX`, 'buy-x', {
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


                const result = await swapExactTokensForAVAX(ctx.session.token!.address, BigInt(tokenAmount) * BigInt(amount) / BigInt(100), wallet.privateKey, ctx.session.currentTokenWallet.slippage, ctx.from.id);
                console.log(result);

                if (result == null) {
                    sendMessage(ctx.chat.id, `🔴 Transaction has failed... | 💳 Sender: ${wallet.address}`);
                }
                else {
                    sendMessage(ctx.chat.id, `🟢 Sell <a href="https://snowtrace.io/tx/${result.hash}?chainId=43113">transaction</a> succeeded | 💳 Sender: ${wallet.address}`, "HTML");
                }
            }
            else {
                sendMessage(ctx.chat.id, "Selling multiple wallets...");
                for (let i = 0; i < ctx.session.wallets.length; i++) {
                    const wallet = ctx.session.wallets[i];

                    const tokenAmount = await getTokenBalance(ctx.session.token!.address, wallet.address);

                    sendMessage(ctx.chat.id, `🟣 Submitting sell transaction | Sender: ${wallet.address}`);


                    const result = await swapExactTokensForAVAX(ctx.session.token!.address, BigInt(tokenAmount) * BigInt(amount) / BigInt(100), wallet.privateKey, ctx.session.currentTokenWallet.slippage, ctx.from.id);
                    console.log(result);

                    if (result == null) {
                        sendMessage(ctx.chat.id, `🔴 Transaction has failed... | 💳 Sender: ${wallet.address}`);
                    }
                    else {
                        sendMessage(ctx.chat.id, `🟢 Sell <a href="https://snowtrace.io/tx/${result.hash}?chainId=43113">transaction</a> succeeded | 💳 Sender: ${wallet.address}`, "HTML");
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

export default tokenMenu;