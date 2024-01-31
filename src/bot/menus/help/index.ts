import { MenuTemplate, createBackMainMenuButtons } from "grammy-inline-menu";
import { BotContext } from "../../../types";

const helpMenu = new MenuTemplate<BotContext>(ctx => {
  const text = `Support commands:\n` +
    `/start - Your Gateway to ETH DeFi\n` +
    `/sniper - Snipe token on ETH\n` +
    `/trades - Track, monitor your trades\n` +
    `/buysell - Swap Token\n` +
    `/referral - Referral System\n` +
    `/wallets - Config wallets\n` +
    `/help - Tutorial & Help`;
  return text;
});

helpMenu.manualRow(createBackMainMenuButtons());


export default helpMenu;