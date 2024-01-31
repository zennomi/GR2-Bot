import { MenuTemplate, createBackMainMenuButtons } from "grammy-inline-menu";
import { BotContext } from "../../../types";
import ReferralModel from "../../../models/referral";

const referralMenu = new MenuTemplate<BotContext>(async ctx => {
  const result = await ReferralModel.findOne({
    owner: ctx.from.id
  });


  const text = `Referral System Report:\n` +
    `Your referral link: https://t.me/pororo_test_bot?start=${result!.referralCode}\n` +
    `Lifetime ETH earned: ${result!.feeAccumulated}\n` +
    `Refer your friends and earn 25% of their fees at first month, 15% second and 10% forever!`;
  return text;
});

referralMenu.manualRow(createBackMainMenuButtons());

referralMenu.interact("Create Claim Request", "create_claim_request", {
  do: async ctx => {
    return false;
  }
});

referralMenu.interact("Claim History", "claim_history", {
  do: async ctx => {
    return false;
  }
});

export default referralMenu;