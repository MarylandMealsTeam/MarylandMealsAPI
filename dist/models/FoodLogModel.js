"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// import { emptyMacros } from "../interfaces/Macros.js";
const mongodb_1 = require("mongodb");
const mongoose_1 = require("mongoose");
const MacrosSchema_1 = __importDefault(require("./MacrosSchema"));
const Macros_1 = require("../interfaces/Macros");
const FoodLogSchema = new mongoose_1.Schema({
    userId: {
        type: mongodb_1.ObjectId,
        ref: "UserModel",
        required: true,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    target: {
        type: MacrosSchema_1.default,
        required: true,
        default: Macros_1.emptyMacros,
    },
    consumed: {
        type: MacrosSchema_1.default,
        required: false,
        default: Macros_1.emptyMacros,
    },
    ids: {
        type: [{ id: Number, quantity: Number }],
        required: false,
        default: [],
    },
}, {
    timestamps: true,
});
const FoodLogModel = (0, mongoose_1.model)("FoodLog", FoodLogSchema);
exports.default = FoodLogModel;
