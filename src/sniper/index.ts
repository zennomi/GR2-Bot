import { TransactionResponse, parseEther } from "ethers";
import { addLiquiditySignatures, wssProvider } from "../utils/contract";
import { swapExactETHForTokens } from "../services/trade";
import SniperModel, { Sniper } from "../models/sniper";
import { groupBy, uniqWith } from "lodash";
import WalletModel, { Wallet } from "../models/wallet";
import bot from "../bot";
import logger from "../logger";

let tokenToSnipers: Record<string, Sniper[]> = {}
let ownerToWallet: Record<string, Wallet> = {}

async function updateTokenToSnipers() {
    const snipers = await SniperModel.find()
    const owners = uniqWith(snipers.map(s => s.owner), (a, b) => a === b)
    for (const owner of owners) {
        const wallet = await WalletModel.findOne({ owner })
        if (wallet) {
            ownerToWallet[owner] = wallet
        }
    }
    tokenToSnipers = groupBy(snipers, "token")
}

export default async function sniperListener() {
    logger.info("Start listening")
    updateTokenToSnipers()
    wssProvider.on("pending", (txHash) => {
        wssProvider.getTransaction(txHash).then((tx) => tx && handleTx(tx))
    });

    wssProvider.on("error", () => { });
}

async function handleTx(tx: TransactionResponse) {
    if (addLiquiditySignatures.some(s => tx.data.startsWith(s))) {
        const tokens = Object.keys(tokenToSnipers)
        for (const token of tokens) {
            if (tx.data.toLowerCase().includes(token.toLowerCase().slice(2,))) {
                if (!tokenToSnipers[token]) return
                for (const sniper of tokenToSnipers[token]) {
                    const wallet = ownerToWallet[sniper.owner]
                    if (!wallet) continue;
                    try {
                        bot.api.sendMessage(sniper.owner, `Sniperring ${sniper.token} with ${sniper.ethAmount} ETH`).catch(() => { })
                        const tx = await swapExactETHForTokens(sniper.token, parseEther(sniper.ethAmount), wallet.privateKey, 5000, sniper.owner)
                        if (tx) {
                            bot.api.sendMessage(sniper.owner, `Sniperred ${sniper.token} with ${sniper.ethAmount} ETH successfully!\n<a href="https://sepolia.etherscan.io/tx/${tx.hash}">Transaction</a>`, { parse_mode: "HTML" }).catch(() => { })
                            await SniperModel.findByIdAndDelete(sniper._id)
                        }
                    } catch (error) {
                        logger.error(error)
                    }
                }
            }
        }
    }
}

