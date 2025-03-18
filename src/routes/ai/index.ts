import express, {
  Request,
  Response,
  RequestHandler,
  NextFunction,
} from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { User } from "@/interfaces/User";
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
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

    const response = await fetch("https://terpalert.xyz/api/v1/daily-items/?all=true&date=2025-03-01");
    const data = await response.json();
    const dailyMenuItems = data.results.map((item: { menu_item?: { name?: string, calories?: number, protein?: number, carbs?: number, fats?: number } }) => {
      const { name, calories, protein, carbs, fats } = item.menu_item || {};
      
      // You can store the nutritional info as a string or as an object
      if (name) {
          return {
              name,
              calories,
              protein,
              carbs,
              fats
          };
      }
      return null; // Return null for items without a name
  }).filter(Boolean);    // console.log(dailyMenuItems);

    const formattedMenu = dailyMenuItems.map((item: { name: string; calories?: number; protein?: number; carbs?: number; fats?: number }) => 
      `${item.name} (Calories: ${item.calories}, Protein: ${item.protein}g, Carbs: ${item.carbs}g, Fats: ${item.fats}g)`
    ).join(", ");
    console.log("Formatted Menu:", formattedMenu);

    const prompt = `
      You are a helpful AI assistant that creates personalized meal plans for students.
      You will be provided with:

      - Information about the student (dietary preferences, goals, restrictions, etc.)
      - A list of available menu items for the day

      Your task: Create a meal plan tailored to the student's information using ONLY the menu items provided.

      Important Rules:
      - Use only the provided menu items when the menu is given.
      - Do NOT invent or suggest any items that are not listed in the menu.
      - If the menu is empty or not provided, you may suggest reasonable meal items based on the student's information.

      Student Information:
      ${context}

      Available Menu Items (select only from these):
      ${formattedMenu}

      Return the meal plan strictly in the following JSON format:
      {
        "breakfast": ["item1", "item2"],
        "lunch": ["item3", "item4"],
        "dinner": ["item5", "item6"],
      }

      Include ONLY menu item names in the arrays. Do not add descriptions or extra text.
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

export default app;
