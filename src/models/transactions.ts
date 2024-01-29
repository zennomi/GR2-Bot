import { ReturnModelType, getModelForClass, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import { ethers } from "ethers";
import { User as TelegramUser } from "grammy/types";

export class Transaction extends TimeStamps {
  @prop()
  public transactionHash!: string;

  @prop()
  public sender!: string;

  @prop()
  public owner!: number;
}

const TransactionModel = getModelForClass(Transaction);

export default TransactionModel;