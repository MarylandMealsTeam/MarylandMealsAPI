"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_1 = __importDefault(require("./user"));
const authenticate_1 = __importDefault(require("./authenticate"));
const ai_1 = __importDefault(require("./ai"));
const routes = express_1.default.Router();
routes.use("/authenticate", authenticate_1.default);
routes.use("/user", user_1.default);
routes.use("/ai", ai_1.default);
exports.default = routes;
