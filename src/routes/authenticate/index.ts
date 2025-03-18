import UserModel from "../../models/UserModel";
import FoodLogModel from "../../models/FoodLogModel";
import express, { Request, Response, NextFunction } from "express";
import { User } from "@/interfaces/User";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dotenv from "dotenv";

declare module "express-session" {
  export interface SessionData {
    userId: string; // Or change the type based on your user ID format
  }
}

dotenv.config();

const authenticate = express.Router();

authenticate.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new UserModel({
      name,
      email,
      password: hashedPassword,
    });
    await user.save();
    res.send({ message: "User registered!" });
  } catch (error) {
    res.status(401).send({ error: "Unable to register user" });
  }
});

authenticate.post("/login", async (req, res) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });

    if (user && bcrypt.compareSync(password, user.password)) {
      req.session.userId = user.id;
      res.send({ message: "Successfully logged in!" });
    } else {
      res.status(401).send({ error: "Password incorrect" });
    }
  } catch (error) {
    res.status(401).send({ error: "Unable to login user" });
  }
});

export default authenticate;
