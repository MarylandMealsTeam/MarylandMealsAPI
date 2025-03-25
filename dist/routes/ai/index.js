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
const express_1 = __importDefault(require("express"));
const generative_ai_1 = require("@google/generative-ai");
const UserModel_1 = __importDefault(require("../../models/UserModel"));
const dotenv_1 = __importDefault(require("dotenv"));
const buffer_1 = require("buffer");
dotenv_1.default.config();
const ai = express_1.default.Router();
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    }
    else {
        res.status(401).send({ message: "User not authenticated" });
    }
};
//Comment out below for testing
ai.use((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.session.userId;
    const user = yield UserModel_1.default.findById(userId);
    const t = user;
    res.locals.user = user;
    next();
}));
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
ai.post("/detect-foods", requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { imageUrl, imageBase64, menu } = req.body;
        if (!imageUrl && !imageBase64) {
            res
                .status(400)
                .json({ error: "imageUrl is required in the request body" });
            return;
        }
        let base64Image = "";
        if (imageUrl && !imageBase64) {
            const response = yield fetch(imageUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch image: ${response.statusText}`);
            }
            const imageResp = yield response.arrayBuffer();
            base64Image = buffer_1.Buffer.from(imageResp).toString("base64");
        }
        else if (imageBase64) {
            base64Image = imageBase64;
        }
        let prompt = "List all foods in this image as comma seperated values only.";
        if (menu) {
            prompt = prompt.concat(`The foods in the image can only be from the following menu: ${menu}`);
        }
        const result = yield model.generateContent([
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg",
                },
            },
            prompt,
        ]);
        res.json({ foods: result.response.text() });
    }
    catch (error) {
        console.error("Error processing the request:", error);
        res
            .status(500)
            .json({ error: "An error occurred while processing the request" });
    }
}));
ai.post("/meal-recommender", requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = res.locals.user;
        const context = "Current Weight: " +
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
        const response = yield fetch("https://terpalert.xyz/api/v1/daily-items/?all=true&date=2025-01-28");
        const data = yield response.json();
        const dailyMenuItems = data.results.filter((item) => { var _a; return (_a = item.menu_item) === null || _a === void 0 ? void 0 : _a.name; });
        const formattedMenu = dailyMenuItems
            .map((item) => JSON.stringify(item.menu_item))
            .join(",\n");
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
        const result = yield model.generateContent(prompt);
        res.json({
            plan: result.response
                .text()
                .replace(/```[a-zA-Z]*/g, "")
                .replace(/```/g, ""),
        });
    }
    catch (error) {
        console.error("Error processing the request:", error);
        res
            .status(500)
            .json({ error: "An error occurred while processing the request" });
    }
}));
ai.post("/suggest-macros", requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = res.locals.user;
        const context = `Height: ${user.height} inches, Current Weight: ${user.currentWeight}, Goal Weight: ${user.goalWeight}`;
        const prompt = `
      You are an expert nutritionist. You are given a person's height, weight, and their goal weight.
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
        const result = yield model.generateContent(prompt);
        console.log(result.response
            .text()
            .replace(/```[a-zA-Z]*/g, "")
            .replace(/```/g, ""));
        res.json({
            macros: result.response
                .text()
                .replace(/```[a-zA-Z]*/g, "")
                .replace(/```/g, ""),
        });
    }
    catch (error) {
        console.error("Error processing the request:", error);
        res
            .status(500)
            .json({ error: "An error occurred while processing the request" });
    }
}));
exports.default = ai;
