import { ReturnModelType, getModelForClass, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import { ethers } from "ethers";
import { User as TelegramUser } from "grammy/types";

export class Referral extends TimeStamps {
  @prop()
  public owner!: number;

  @prop()
  public referralCode?: string;


  @prop()
  public feeAccumulated!: number;

  @prop()
  public feeClaimed!: number;

}

const ReferralModel = getModelForClass(Referral);

export default ReferralModel;