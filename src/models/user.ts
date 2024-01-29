import { ReturnModelType, getModelForClass, prop } from "@typegoose/typegoose";
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses";
import { User as TelegramUser } from "grammy/types";

export class User extends TimeStamps {
    @prop()
    public name?: string;

    @prop({ required: true })
    public _id!: number;

    @prop()
    public current_address?: string;

    public static async findOrCreateByCtxFrom(this: ReturnModelType<typeof User>, ctxFrom: TelegramUser) {
        let user = await this.findById(ctxFrom.id);
        if (!user) {
            user = await this.create({
                _id: ctxFrom.id,
                name: ctxFrom.username,
                current_address: null
            });
        }
        return user;
    }
}

const UserModel = getModelForClass(User);

export default UserModel;