import FoodLog from "@/interfaces/FoodLog";
// import { emptyMacros } from "@/interfaces/Macros";
import { ObjectId } from "mongodb";
import { Schema, model } from "mongoose";
import MacrosSchema from "./MacrosSchema";
import { emptyMacros } from "@/interfaces/Macros";

const FoodLogSchema = new Schema<FoodLog>(
  {
    userId: {
      type: ObjectId,
      ref: "UserModel",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    target: {
      type: MacrosSchema,
      required: true,
      default: emptyMacros,
    },
    consumed: {
      type: MacrosSchema,
      required: false,
      default: emptyMacros,
    },
    ids: {
      type: [{ id: Number, quantity: Number }],
      required: false,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const FoodLogModel = model("FoodLog", FoodLogSchema);

export default FoodLogModel;
