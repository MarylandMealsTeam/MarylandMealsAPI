"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const mongoose_1 = require("mongoose");
const MacrosSchema_1 = __importDefault(require("./MacrosSchema"));
const Macros_1 = require("../interfaces/Macros");
const UserSchema = new mongoose_1.Schema({
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
        type: [{ type: mongodb_1.ObjectId, ref: "FoodLogModel" }],
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
        type: MacrosSchema_1.default,
        required: false,
        default: Macros_1.emptyMacros,
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
}, {
    timestamps: true,
});
const UserModel = (0, mongoose_1.model)("User", UserSchema);
exports.default = UserModel;
