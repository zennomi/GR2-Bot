import { MenuTemplate, createBackMainMenuButtons } from "grammy-inline-menu"
import { BotContext } from "../../../types"

const sniperMenu = new MenuTemplate<BotContext>(ctx => {
    return `Active Snipers: 0`
})

sniperMenu.manualRow(createBackMainMenuButtons())

sniperMenu.interact("Lists", "lists", {
    do: async ctx => {
        await ctx.reply("Lists:\n")
        return false
    }
})

sniperMenu.interact("Create new sniper", "create", {
    do: async ctx => {
        await ctx.conversation.enter("createSniper")
        return false
    }
})

export default sniperMenu