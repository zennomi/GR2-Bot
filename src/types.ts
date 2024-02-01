import { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import { ChatTypeContext, Context, SessionFlavor } from "grammy";
import { Sniper } from "./models/sniper";

// Define the shape of our session.
export interface SessionData {
    token?: {
        address: string,
        isBuyMode: boolean,
    },
    wallets: {
        address: string,
        privateKey: string,
        owner: number;
        balance: number;
    }[];
    currentWallet: {
        address: string;
        index: number;
    };
    currentTokenWallet: {
        address: string;
        index: number;
        isAllWallet: boolean;
        slippage: number;
    };
    snipers: Sniper[],
    currentSniper?: Sniper
}

// Flavor the context type to include sessions.
export type BotContext = ChatTypeContext<Context, "private"> & SessionFlavor<SessionData> & ConversationFlavor;

export type BotConversation = Conversation<BotContext>;