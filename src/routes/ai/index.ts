import express, {
  Request,
  Response,
  RequestHandler,
  NextFunction,
} from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "@/interfaces/User";
import UserModel from "@/models/UserModel";
import dotenv from "dotenv";
import { Buffer } from "buffer";
import { DetectFoodsRequest, MealRecommenderRequest } from "@/types";

dotenv.config();

const ai = express.Router();
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).send({ message: "User not authenticated" });
  }
};

//Comment out below for testing
ai.use(async (req, res, next) => {
  const userId = req.session.userId;
  const user = await UserModel.findById(userId);
  const t = user as User;
  res.locals.user = user as User;
  next();
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });

ai.post("/detect-foods", requireAuth, async (req, res) => {
  try {
    const { imageUrl, imageBase64, menu } = req.body as DetectFoodsRequest;
    if (!imageUrl && !imageBase64) {
      res
        .status(400)
        .json({ error: "imageUrl is required in the request body" });
      return;
    }

    let base64Image: string = "";

    if (imageUrl && !imageBase64) {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const imageResp = await response.arrayBuffer();
      base64Image = Buffer.from(imageResp).toString("base64");
    } else if (imageBase64) {
      base64Image = imageBase64;
    }

    let prompt = "List all foods in this image as comma seperated values only.";
    if (menu) {
      prompt = prompt.concat(
        `The foods in the image can only be from the following menu: ${menu}`
      );
    }

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
      prompt,
    ]);

    res.json({ foods: result.response.text() });
  } catch (error) {
    console.error("Error processing the request:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});

ai.post("/meal-recommender", requireAuth, async (req, res) => {
  try {
    const user = res.locals.user as User;
    const context =
      "Current Weight: " +
      user.currentWeight +
      "\nGoal Weight: " +
      user.goalWeight +
      "\nCalorie Goal: " +
      user.goalMacros.calories +
      " calories\nProtein Goal: " +
      user.goalMacros.protein +
      " grams \nCarb Goal: " +
      user.goalMacros.carbs +
      " grams \nFat Goal: " +
      user.goalMacros.fats +
      " grams";

    const prompt = `Based on the following information about a person, create a meal plan for them: ${context}`;
    const result = await model.generateContent(prompt);

    res.json({ plan: result.response.text() });
  } catch (error) {
    console.error("Error processing the request:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});

export default ai;
