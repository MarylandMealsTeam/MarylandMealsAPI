import express, { Request, Response, RequestHandler } from 'express';
import bodyParser from 'body-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import { Buffer } from 'buffer';
import {
  FoodDictionary,
  DetectFoodsRequest,
  MealRecommenderRequest,
  GetDescriptionRequest,
  GenerateImagesResponse,
  DetectFoodsResponse,
  MealRecommenderResponse,
  GetDescriptionResponse
} from './types';

dotenv.config();

const api = express();
const HOST = '0.0.0.0';
const PORT = parseInt(process.env.PORT as string, 10) || 3000;
api.use(bodyParser.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro' });

const detectFoods: RequestHandler = async (req, res) => {
  try {
    const { imageUrl, imageBase64, menu } = req.body as DetectFoodsRequest;
    if (!imageUrl && !imageBase64) {
      res.status(400).json({ error: 'imageUrl is required in the request body' });
      return;
    }

    let base64Image: string = "";

    if (imageUrl && !imageBase64) {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const imageResp = await response.arrayBuffer();
      base64Image = Buffer.from(imageResp).toString('base64');
    } else if (imageBase64) {
      base64Image = imageBase64;
    }

    let prompt = 'List all foods in this image as comma seperated values only.';
    if (menu) {
      prompt = prompt.concat(
        `The foods in the image can only be from the following menu: ${menu}`
      );
    }

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: 'image/jpeg',
        },
      },
      prompt,
    ]);

    res.json({ foods: result.response.text() });
  } catch (error) {
    console.error('Error processing the request:', error);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
};

const mealRecommender: RequestHandler = async (req, res) => {
  try {
    const { context } = req.body as MealRecommenderRequest;
    if (!context) {
      res.status(400).json({ error: 'context is required in the request body' });
      return;
    }

    const prompt = `Based on the following information about a person, create a meal plan for them: ${context}`;
    const result = await model.generateContent(prompt);

    res.json({ plan: result.response.text() });
  } catch (error) {
    console.error('Error processing the request:', error);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
};

// const getDescription: RequestHandler = async (req, res) => {
//   try {
//     const { context } = req.body as GetDescriptionRequest;
//     if (!context) {
//       res.status(400).json({ error: 'context is required in the request body' });
//       return;
//     }

//     const prompt = `Based on the following ingredients and food name, generate a description of the dish around 10-20 words: ${context}`;
//     const result = await model.generateContent(prompt);

//     res.json({ plan: result.response.text() });
//   } catch (error) {
//     console.error('Error processing the request:', error);
//     res.status(500).json({ error: 'An error occurred while processing the request' });
//   }
// };

// async function getImageUrl(foodName: string): Promise<string | null> {
//   const browser = await puppeteer.launch({ 
//     headless: true
//   });
//   const page = await browser.newPage();
//   await page.goto(
//     `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(foodName)}`
//   );

//   const imageUrl = await page.evaluate(() => {
//     const img = document.querySelector('img');
//     return img ? img.src : null;
//   });

//   await browser.close();
//   return imageUrl;
// }

// async function fetchImageAsBase64(url: string | null): Promise<string | null> {
//   if (!url) return null;
//   try {
//     const response = await axios.get(url, { responseType: 'arraybuffer' });
//     return `data:image/jpeg;base64,${Buffer.from(
//       response.data,
//       'binary'
//     ).toString('base64')}`;
//   } catch (error) {
//     console.error('Failed to fetch image:', error);
//     return null;
//   }
// }

// const generateImages: RequestHandler = async (req, res) => {
//   const foodDictionary = req.body as FoodDictionary;
//   const result: GenerateImagesResponse = {};

//   await Promise.all(
//     Object.entries(foodDictionary).map(async ([id, foodName]) => {
//       const imageUrl = await getImageUrl(foodName);
//       const base64Image = await fetchImageAsBase64(imageUrl);
//       result[id] = base64Image;
//     })
//   );

//   res.json(result);
// };

// api.post('/generate-images', generateImages);
api.post('/detect-foods', detectFoods);
api.post('/meal-recommender', mealRecommender);
// api.post('/get-description', getDescription);

api.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});