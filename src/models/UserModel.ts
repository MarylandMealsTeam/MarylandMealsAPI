import User from "@/interfaces/User";
import { ObjectId } from "mongodb";
import { Schema, model } from "mongoose";
import MacrosSchema from "./MacrosSchema";
import { emptyMacros } from "@/interfaces/Macros";

const UserSchema = new Schema<User>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Email is invalid",
      ],
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: false,
      default: "",
    },
    dateOfBirth: {
      type: Date,
      required: false,
      default: Date.now,
    },
    height: {
      type: Number,
      required: false,
      default: 0,
    },
    sex: {
      type: String,
      required: false,
      default: "male",
    },
    foodLogIds: {
      type: [{ type: ObjectId, ref: "FoodLogModel" }],
      required: false,
      default: [],
    },
    currentWeight: {
      type: Number,
      required: false,
      default: 0,
    },
    goalWeight: {
      type: Number,
      required: false,
      default: 0,
    },
    goalMacros: {
      type: MacrosSchema,
      required: false,
      default: emptyMacros,
    },
    allergens: {
      type: [String],
      required: false,
      default: [],
    },
    diningHallPreferences: {
      type: [String],
      required: false,
      default: ["251 North", "Yahentamitsi", "South Campus"],
    },
  },
  {
    timestamps: true,
  }
);

const UserModel = model("User", UserSchema);

export default UserModel;
