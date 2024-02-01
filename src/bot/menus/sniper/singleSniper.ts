import { MenuTemplate, createBackMainMenuButtons } from "grammy-inline-menu";
import { BotContext } from "../../../types";
import { ethers } from "ethers";
import config from "../../../config";
import WalletModel from "../../../models/wallet";
import SniperModel from "../../../models/sniper";

const singleSniperMenu = new MenuTemplate<BotContext>(async ctx => {

    const tokenAddress = ctx.match?.[1];
    if (!tokenAddress) return "Error";

    const sniper = ctx.session.snipers.find(w => w.token.slice(0, 5) === tokenAddress)!;

    if (!sniper) return "Error";

    ctx.session.currentSniper = sniper

    return `Token: ${sniper.token}\nBuy amount: ${sniper.ethAmount} ETH \n`;
});

singleSniperMenu.manualRow(createBackMainMenuButtons());

singleSniperMenu.interact("Delete", "delete", {
    joinLastRow: true,
    do: async ctx => {
        const { currentSniper } = ctx.session

        if (currentSniper) {
            await SniperModel.findByIdAndDelete(currentSniper._id)
            ctx.session.snipers = ctx.session.snipers.filter(s => s._id !== currentSniper._id)
        }

        ctx.session.currentSniper = undefined

        return "..";
    }
});

export default singleSniperMenu;