import { MenuTemplate, createBackMainMenuButtons } from "grammy-inline-menu"
import { BotContext } from "../../../types"
import SniperModel from "../../../models/sniper"
import singleSniperMenu from "./singleSniper"

const sniperMenu = new MenuTemplate<BotContext>(async ctx => {
    if (ctx.session.snipers.length === 0) {
        ctx.session.snipers = await SniperModel.find({ owner: ctx.from.id })
    }
    const { snipers } = ctx.session
    return `Active Snipers: ${snipers.length}`
})

sniperMenu.manualRow(createBackMainMenuButtons())

sniperMenu.chooseIntoSubmenu('select',
    ctx => Object.fromEntries(ctx.session.snipers.map((s, index) => ([s.token.slice(0, 5), `(${s.ethAmount} ETH) ${s.token}`]))),
    singleSniperMenu,
    { columns: 1 })

sniperMenu.interact("Create new sniper", "create", {
    do: async ctx => {
        await ctx.conversation.enter("createSniper")
        return false
    }
})

sniperMenu.interact("Reload 🔄️", "reload", {
    do: async ctx => {
        ctx.session.snipers = await SniperModel.find({ owner: ctx.from.id })
        return true
    }
})

export default sniperMenu