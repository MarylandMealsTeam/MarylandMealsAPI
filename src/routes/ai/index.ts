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

const app = express.Router();
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).send({ message: "User not authenticated" });
  }
};

//Comment out below for testing
app.use(async (req, res, next) => {
  const userId = req.session.userId;
  const user = await UserModel.findById(userId);
  const t = user as User;
  res.locals.user = user as User;
  next();
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });

app.post("/detect-foods", requireAuth, async (req, res) => {
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

app.post("/meal-recommender", requireAuth, async (req, res) => {
  try {
    const { context } = req.body as MealRecommenderRequest;
    if (!context) {
      res
        .status(400)
        .json({ error: "context is required in the request body" });
      return;
    }

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

app.post("/suggest-macros", requireAuth, async (req, res) => {
  try {
    const { context } = req.body;
    if (!context) {
      res
        .status(400)
        .json({ error: "context is required in the request body" });
      return;
    }
    const prompt = `
      You are an expert nutiritionist. You are given a person's height, weight, and their goal weight.
      Suggest a daily macro split for them that includes the number of calories, protein, carbs, and fats
      they should eat. Protein, carbs, and fats should be in grams. 

      Return the daily macro split strictly in the following JSON format with no additional text:
      {
        "calorie": number,
        "protein": number,
        "carbs": number,
        "fats": number,
      }

      Here is the person's height, weight, and goal weight:
      ${context}
    `;
    const result = await model.generateContent(prompt);
    res.json({ macros: result.response.text() });
  } catch (error) {
    console.error("Error processing the request:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});

export default app;
