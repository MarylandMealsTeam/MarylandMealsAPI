import express, { Request, Response, NextFunction } from "express";
import User from "@/interfaces/User";
import bcrypt from "bcryptjs";
import { getFoodLog } from "./log";

const update = express.Router();

update.patch("/", async (req, res) => {
  const user: User = res.locals.user;
  const staticFields = ["email", "password"];
  const body = req.body;

  try {
    for (const key in body) {
      const value = body[key];

      if (!staticFields.includes(key)) {
        user.set(key, value);
      }

      if (key === "goalMacros") {
        const log = await getFoodLog(user, new Date());
        log.target = value;
        log.save();
      }
    }

    user.save();
    res.send({ message: "Success" });
  } catch (error) {
    res.status(401).send(error);
  }
});

update.patch("/password", async (req, res) => {
  try {
    const user: User = res.locals.user;
    const { oldPassword, newPassword } = req.body;

    if (bcrypt.compareSync(oldPassword, user.password)) {
      user.password = await bcrypt.hash(newPassword, 10);
      user.save();
      res.send({ message: "Success" });
    } else {
      res.status(401).send({ message: "Invalid old password!" });
    }
  } catch (error) {
    res.status(401).send(error);
  }
});

update.patch("/generate-goal-weight", async (req, res) => {
  const user: User = res.locals.user;

  try {
    const newGoalWeight = user.goalWeight + 5;
    user.goalWeight = newGoalWeight;
    user.save();
    res.send({ newGoalWeight });
  } catch (error) {
    res.status(401).send(error);
  }
});

export default update;
