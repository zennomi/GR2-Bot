import { WebSocketProvider } from "ethers";
import config from "../config";

export const wssProvider = new WebSocketProvider(config.WSS_RPC)

// https://www.4byte.directory/api/v1/signatures/?text_signature=addliquidity
export const addLiquiditySignatures = ["0xd7708116", "0x6d517aab", "0xf305d719", "0xe8e33700"]