import { ReturnModelType, getModelForClass, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import mongoose from "mongoose";

export class Cache extends TimeStamps {
    @prop({ required: true })
    public _id!: string

    @prop({ required: true, type: () => mongoose.Schema.Types.Mixed })
    public data!: Object
}

const CacheModel = getModelForClass(Cache)

export default CacheModel