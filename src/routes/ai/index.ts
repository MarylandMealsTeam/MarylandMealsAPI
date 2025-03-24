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
import Meal from "@/interfaces/Meal";

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
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

    const response = await fetch("https://terpalert.xyz/api/v1/daily-items/?all=true&date=2025-03-01");
    const data = await response.json();
    const dailyMenuItems: Meal[] = data.results.filter((item: Meal) => item.menu_item?.name);

    const formattedMenu = dailyMenuItems.map((item) => 
      JSON.stringify(item.menu_item)
    ).join(",\n");

    const prompt = `
      You are a helpful AI assistant that creates personalized meal plans for students.
      You will be provided with:

      - Information about the student (dietary preferences, goals, restrictions, etc.)
      - A list of available menu items for the day with full nutritional information and details

      Your task: Create a meal plan tailored to the student's information using ONLY the menu items provided.

      Important Rules:
      - Use only the provided menu items when the menu is given.
      - Do NOT invent or suggest any items that are not listed in the menu.
      - Use additional information like ingredients, allergens, and serving size when making decisions.
      - If the menu is empty or not provided, you may suggest reasonable meal items based on the student's information.

      Student Information:
      ${context}

      Available Menu Items:
      [
      ${formattedMenu}
      ]

      Return the meal plan strictly in the following JSON format with no additional text:
      {
        "breakfast": Meal[],
        "lunch": Meal[],
        "dinner": Meal[],
      }

      Here is the Meal interface:
      interface Meal {
        id: number;
        menu_item: {
          id: number;
          name: string;
          ingredients: string;
          image: any;
          calories: number;
          carbs: number;
          protein: number;
          fats: number;
          allergens?: string[];
          serving_size?: string;
        };
        date: string;
        dh_y: boolean;
        dh_south: boolean;
        dh_251: boolean;
      }
    `;
    const result = await model.generateContent(prompt);

    res.json({ plan: result.response.text().replace(/```[a-zA-Z]*/g, "").replace(/```/g, "") });
  } catch (error) {
    console.error("Error processing the request:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});

ai.post("/suggest-macros", requireAuth, async (req, res) => {
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
        "calories": number,
        "fats": number,
        "protein": number,
        "carbs": number,
      }

      Here is the person's height, weight, and goal weight:
      ${context}
    `;
    const result = await model.generateContent(prompt);
    console.log(result.response.text().replace(/```[a-zA-Z]*/g, "").replace(/```/g, ""));
    res.json({ macros: result.response.text().replace(/```[a-zA-Z]*/g, "").replace(/```/g, "") });
  } catch (error) {
    console.error("Error processing the request:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});

export default ai;
