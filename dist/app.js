"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const cookie_session_1 = __importDefault(require("cookie-session"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cookie_session_1.default)({
    secret: process.env.SECRET_KEY,
    name: process.env.COOKIE_NAME,
    secure: process.env.NODE_ENV === "production",
}));
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === "development" ? process.env.EXPO_URL : "*",
    allowedHeaders: "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD"],
    credentials: true,
}));
app.use("/api", routes_1.default);
//change host to 0.0.0.0 when deploying, localhost for test
app.listen({ port: process.env.PORT, host: "0.0.0.0" }, () => {
    console.log("Server running, with environment=" + process.env.NODE_ENV);
});
