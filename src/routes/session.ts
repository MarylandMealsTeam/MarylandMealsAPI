import UserModel from "../models/UserModel";
import FoodLogModel from "../models/FoodLogModel";
import express, { Request, Response, NextFunction } from "express";
import { User } from "../interfaces/User";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import dotenv from "dotenv";

const router = express.Router();

dotenv.config();

router.post("/authenticate", async (req, res) => {
  await mongoose.connect(process.env.EXPO_PUBLIC_MONGODB_URI!);
  const { email, password } = req.body;
  const user = await UserModel.findOne({ email });

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.userId = user.id;
    res.send({ message: "Successfully logged in!" });
  } else {
    res.sendStatus(401);
  }
});
  
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new UserModel({
    name,
    email,
    password: hashedPassword,
  });
  await user.save();
  res.send({ message: "User registered!" });
});

export default router;
