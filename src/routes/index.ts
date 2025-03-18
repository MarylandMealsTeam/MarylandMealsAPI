import express from "express";
import user from "./user";
import authenticate from "./authenticate";
import ai from "./ai";

const routes = express.Router();

routes.use("/authenticate", authenticate);
routes.use("/user", user);
routes.use("/ai", ai)

export default routes;
