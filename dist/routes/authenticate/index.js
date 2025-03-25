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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const authenticate = express_1.default.Router();
authenticate.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = new UserModel_1.default({
            name,
            email,
            password: hashedPassword,
        });
        yield user.save();
        res.send({ message: "User registered!" });
    }
    catch (error) {
        res.status(401).send({ error: "Unable to register user" });
    }
}));
authenticate.post("/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(process.env.MONGODB_URI);
        const { email, password } = req.body;
        const user = yield UserModel_1.default.findOne({ email });
        if (user && bcryptjs_1.default.compareSync(password, user.password)) {
            req.session.userId = user.id;
            res.send({ message: "Successfully logged in!" });
        }
        else {
            res.status(401).send({ error: "Password incorrect" });
        }
    }
    catch (error) {
        res.status(401).send({ error: "Unable to login user" });
    }
}));
exports.default = authenticate;
