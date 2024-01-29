import { ReturnModelType, getModelForClass, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import { ethers } from "ethers";
import { User as TelegramUser } from "grammy/types";

export class Referree extends TimeStamps {
  @prop()
  public referree!: number;

  @prop()
  public referrer!: number;

}

const ReferreeModel = getModelForClass(Referree);

export default ReferreeModel;