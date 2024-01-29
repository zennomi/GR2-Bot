import { ReturnModelType, getModelForClass, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import { ethers } from "ethers";
import { User as TelegramUser } from "grammy/types";

export class Wallet extends TimeStamps {
    @prop()
    public address!: string;

    @prop()
    public privateKey!: string;

    @prop()
    public owner!: number;

    @prop()
    public balance!: number;


    public static async addWallet(this: ReturnModelType<typeof Wallet>, address: string, privateKey: string, owner: string) {
        let wallet = await this.findOne({
            address: address
        });
        if (!wallet) {
            wallet = await this.create({
                address: address,
                privateKey: privateKey,
                owner: owner,
                balance: 0
            });
        }
        return wallet;
    }
}

const WalletModel = getModelForClass(Wallet);

export default WalletModel;