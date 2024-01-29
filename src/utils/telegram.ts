import { Keyboard } from "grammy";
import { BotContext, BotConversation } from "../types";
import bot from "../bot";

const defaultValidate = (value: string) => !!value

export async function askSingleQuestion(config: {
    conversation: BotConversation,
    ctx: BotContext,
    question?: string,
    parseMode?: "HTML",
    validate?: (value: string) => boolean,
}): Promise<string> {
    const { conversation, ctx, question, parseMode, } = config

    const validate = config.validate || defaultValidate

    const chatId = ctx.chat!.id

    const { message_id } = await ctx.reply(question ?? "Enter a value:", {
        reply_markup: {
            force_reply: true,
        },
        parse_mode: parseMode
    });

    let result
    let newContext

    do {
        newContext = await conversation.waitForReplyTo(message_id)
        result = newContext.message?.text
    } while (!result || !validate(result));

    newContext.api.deleteMessage(chatId, newContext.message!.message_id);
    newContext.api.deleteMessage(
        chatId,
        message_id
    );

    return result
}

export async function askMultipleChoicesQuestion(config: {
    conversation: BotConversation,
    ctx: BotContext,
    question?: string,
    parseMode?: "HTML",
    choices: string[]
}): Promise<string> {
    const { conversation, ctx, question, parseMode, choices } = config

    const chatId = ctx.chat!.id

    let keyboard = new Keyboard()

    choices.forEach(choice => keyboard = keyboard.text(choice))

    const { message_id } = await ctx.reply(question ?? "Select a value", {
        reply_markup: keyboard,
        parse_mode: parseMode,
    });

    let result
    let newContext

    do {
        newContext = await conversation.waitFor(":text")
        result = newContext.message?.text
    } while (!result);

    newContext.api.deleteMessage(chatId, newContext.message!.message_id);
    newContext.api.deleteMessage(
        chatId,
        message_id
    );

    return result
}

export async function sendMessage(chatId: number, message: string, parse_mode?: "HTML") {
    await bot.api.sendMessage(chatId, message, { parse_mode })
}