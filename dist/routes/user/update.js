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
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const log_1 = require("./log");
const update = express_1.default.Router();
update.patch("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = res.locals.user;
    const staticFields = ["email", "password"];
    const body = req.body;
    try {
        for (const key in body) {
            const value = body[key];
            if (!staticFields.includes(key)) {
                user.set(key, value);
            }
            if (key === "goalMacros") {
                const log = yield (0, log_1.getFoodLog)(user, new Date());
                log.target = value;
                log.save();
            }
        }
        user.save();
        res.send({ message: "Success" });
    }
    catch (error) {
        res.status(401).send(error);
    }
}));
update.patch("/password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = res.locals.user;
        const { oldPassword, newPassword } = req.body;
        if (bcryptjs_1.default.compareSync(oldPassword, user.password)) {
            user.password = yield bcryptjs_1.default.hash(newPassword, 10);
            user.save();
            res.send({ message: "Success" });
        }
        else {
            res.status(401).send({ message: "Invalid old password!" });
        }
    }
    catch (error) {
        res.status(401).send(error);
    }
}));
update.patch("/generate-goal-weight", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = res.locals.user;
    try {
        const newGoalWeight = user.goalWeight + 5;
        user.goalWeight = newGoalWeight;
        user.save();
        res.send({ newGoalWeight });
    }
    catch (error) {
        res.status(401).send(error);
    }
}));
exports.default = update;
