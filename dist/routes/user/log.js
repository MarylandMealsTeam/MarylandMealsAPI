"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFoodLog = void 0;
const FoodLogModel_1 = __importDefault(require("../../models/FoodLogModel"));
const express_1 = __importDefault(require("express"));
const log = express_1.default.Router();
const initNewFoodLog = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const log = new FoodLogModel_1.default({
        userId: user.id,
        target: user.goalMacros,
    });
    yield log.save();
    user.foodLogIds.push(log.id);
    yield user.save();
    return log;
});
const getFoodLog = (user, date) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    // Maybe use populate instead?
    const log = (_a = (yield FoodLogModel_1.default.findOne({
        _id: { $in: user.foodLogIds },
        date: {
            $gte: startOfDay,
            $lt: endOfDay,
        },
    }))) !== null && _a !== void 0 ? _a : (yield initNewFoodLog(user));
    return log;
});
exports.getFoodLog = getFoodLog;
log.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = res.locals.user;
    const queryStr = req.query.date;
    const date = new Date(queryStr);
    const { meal, quantity } = req.body;
    try {
        const id = meal.menu_item.id;
        const foodLog = yield (0, exports.getFoodLog)(user, date);
        const consumed = foodLog.consumed;
        console.log(foodLog);
        const totalConsumed = {
            calories: meal.menu_item.calories * quantity + consumed.calories,
            protein: meal.menu_item.protein * quantity + consumed.protein,
            carbs: meal.menu_item.carbs * quantity + consumed.carbs,
            fats: meal.menu_item.fats * quantity + consumed.fats,
        };
        foodLog.consumed = totalConsumed;
        foodLog.ids.push({ id, quantity });
        yield foodLog.save();
        res.send({ message: "success" });
    }
    catch (error) {
        res.status(401).send({ message: error });
    }
}));
log.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = res.locals.user;
    const queryStr = req.query.date;
    const date = new Date(queryStr);
    const log = yield (0, exports.getFoodLog)(user, date);
    res.send(log);
}));
exports.default = log;
