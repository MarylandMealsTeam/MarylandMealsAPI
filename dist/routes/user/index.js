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
const UserModel_1 = __importDefault(require("../../models/UserModel"));
const express_1 = __importDefault(require("express"));
const log_1 = __importDefault(require("./log"));
const update_1 = __importDefault(require("./update"));
const user = express_1.default.Router();
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    }
    else {
        res.status(401).send({ error: "User data not accessible" });
    }
};
user.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.session.userId;
        const user = yield UserModel_1.default.findById(userId);
        res.locals.user = user;
        next();
    }
    catch (error) {
        res.status(401).send({ error: "User not authenticated" });
    }
}));
user.get("/", requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = res.locals.user;
    res.send(user);
}));
user.post("/logout", requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    req.session.destroy((error) => {
        if (error) {
            res.status(401).send({ message: "error" });
        }
        else {
            res.clearCookie(process.env.COOKIE_NAME);
            res.send({ message: "Logged out successfully!" });
        }
    });
}));
user.use("/log", requireAuth, log_1.default);
user.use("/update", requireAuth, update_1.default);
exports.default = user;
