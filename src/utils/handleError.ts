import logger from "../logger"
import { BotContext } from "../types"

export default function handleError(error: any) {
    logger.error(error)
}

export async function handleRepliableError(ctx: BotContext, error: any) {
    if (typeof error === "string") {
        await ctx.reply(error)
      } else {
        handleError(error)
      }
}