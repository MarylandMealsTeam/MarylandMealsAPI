"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
exports.default = new mongoose_1.Schema({
    calories: Number,
    fats: Number,
    protein: Number,
    carbs: Number,
});
