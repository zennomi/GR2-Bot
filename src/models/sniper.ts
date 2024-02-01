import { getModelForClass, prop } from "@typegoose/typegoose";
import { Base, TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";

export interface Sniper extends Base {}

export class Sniper extends TimeStamps {
  @prop({required: true})
  public owner!: number;

  @prop({required: true})
  public token!: string;

  @prop({required: true})
  public ethAmount!: string
}

const SniperModel = getModelForClass(Sniper);

export default SniperModel;