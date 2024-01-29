import { MenuTemplate, createBackMainMenuButtons } from "grammy-inline-menu";
import { BotContext } from "../../../types";
import { ethers } from "ethers";
import config from "../../../config";
import WalletModel from "../../../models/wallet";

const singleWalletMenu = new MenuTemplate<BotContext>(async ctx => {

    const address = ctx.match?.[1];
    if (!address) return "Error";

    const wallet = ctx.session.wallets.find(w => w.address.slice(0, 5) === address)!;
    const index = ctx.session.wallets.indexOf(wallet)!;

    ctx.session.currentWallet.address = wallet.address;
    ctx.session.currentWallet.index = index;

    if (!address) return "Error";

    const provider = new ethers.JsonRpcProvider(config.RPC);

    const balance = await provider.getBalance(wallet.address);

    return `Wallet: ${wallet.address}\nPrivate Key: ${wallet.privateKey} \nBalance: ${ethers.formatEther(balance)}`;
});

singleWalletMenu.manualRow(createBackMainMenuButtons());

singleWalletMenu.interact("Edit", "edit", {
    do: async ctx => {
        await ctx.conversation.enter("editPrivateKey");
        return false;
    }
});

singleWalletMenu.interact("Delete", "delete", {
    joinLastRow: true,
    do: async ctx => {
        const index = ctx.session.currentWallet.index;
        const currentWalletAddress = ctx.session.currentWallet.address;

        await WalletModel.findOneAndDelete({
            address: currentWalletAddress,
        });

        ctx.session.wallets.splice(index, 1);

        return true;
    }
});

export default singleWalletMenu;