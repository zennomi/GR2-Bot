import { MenuTemplate } from "grammy-inline-menu";
import { BotContext } from "../../types";
import tokenMenu from "./token";
import sniperMenu from "./sniper";
import walletMenu from "./wallet";
import transferMenu from "./transfer";
import referralMenu from "./referral";
import helpMenu from "./help";

const menuTemplate = new MenuTemplate<BotContext>((ctx) => {
    const text = `🚀 AvaxTradingBot: Your Gateway to Avax DeFi 🤖\n` +
        `<a href="https://avax.com">Website</a>`;

    return {
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
    };
});

menuTemplate.submenu("📈 Buy & Sell", "token", tokenMenu);

// menuTemplate.interact("⚡ Trades", "trade", {
//     joinLastRow: true,
//     do: async ctx => {
//         await ctx.reply("You don't have any transactions yet");
//         return false;
//     }
// });

menuTemplate.submenu("🏹 Sniper", "sniper", sniperMenu);

menuTemplate.submenu("💳 Wallets", "wallet", walletMenu, {
    // joinLastRow: true,
});
menuTemplate.submenu("📤 Transfer ETH", "transfer", transferMenu);

// menuTemplate.submenu("🤝 Referral", "referral", referralMenu);

// menuTemplate.submenu("ℹ️ Help", "help", helpMenu);

export default menuTemplate;