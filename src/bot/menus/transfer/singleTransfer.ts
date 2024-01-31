import { MenuTemplate, createBackMainMenuButtons } from "grammy-inline-menu";
import { BotContext } from "../../../types";
import { ethers } from "ethers";
import config from "../../../config";
import WalletModel from "../../../models/wallet";
import { sendMessage } from "../../../utils/telegram";

const singleTransferMenu = new MenuTemplate<BotContext>(async ctx => {

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

singleTransferMenu.manualRow(createBackMainMenuButtons());

// singleTransferMenu.interact("Edit", "edit", {
//     do: async ctx => {
//         await ctx.conversation.enter("editPrivateKey");
//         return false;
//     }
// });

singleTransferMenu.interact("Delete", "delete", {
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

singleTransferMenu.interact("Transfer ETH", "transfer", {
    do: async ctx => {
        const mess = `Enter the receiving wallets address with amount \n` +
            `${ethers.Wallet.createRandom().address
            }, 0.001`;
        sendMessage(ctx.chat.id, mess);

        await ctx.conversation.enter("sendToDestination");
        return false;
    }
});

export default singleTransferMenu;;