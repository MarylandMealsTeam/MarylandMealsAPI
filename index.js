const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();
const axios = require("axios");
const puppeteer = require("puppeteer");

const api = express();
const HOST = "0.0.0.0";
const PORT = process.env.PORT;
api.use(bodyParser.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });

async function getImageUrl(foodName) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(
    `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(foodName)}`
  );

  const imageUrl = await page.evaluate(() => {
    const img = document.querySelector("img");
    return img ? img.src : null;
  });

  await browser.close();
  return imageUrl;
}

async function fetchImageAsBase64(url) {
  if (!url) return null;
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return `data:image/jpeg;base64,${Buffer.from(
      response.data,
      "binary"
    ).toString("base64")}`;
  } catch (error) {
    console.error("Failed to fetch image:", error);
    return null;
  }
}

api.post("/generate-images", async (req, res) => {
  const foodDictionary = req.body;
  const result = {};

  await Promise.all(
    Object.entries(foodDictionary).map(async ([id, foodName]) => {
      const imageUrl = await getImageUrl(foodName);
      const base64Image = await fetchImageAsBase64(imageUrl);
      result[id] = base64Image;
    })
  );

  res.json(result);
});

api.post("/detect-foods", async (req, res) => {
  try {
    const { imageUrl, imageBase64, menu } = req.body;
    if (!imageUrl && !imageBase64) {
      return res
        .status(400)
        .json({ error: "imageUrl is required in the request body" });
    }

    let base64Image = null;

    if (imageUrl && !imageBase64) {
      const imageResp = await fetch(imageUrl).then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.statusText}`);
        }
        return response.arrayBuffer();
      });
      base64Image = Buffer.from(imageResp).toString("base64");
    }

    if (imageBase64 && !imageUrl) {
      base64Image = imageBase64;
    }

    let prompt = "List all foods in this image as comma seperated values only.";
    if (menu) {
      let prompt = prompt.concat(
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
    console.log(result.response.text());
  } catch (error) {
    console.error("Error processing the request:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});

api.post("/meal-recommender", async (req, res) => {
  try {
    const { context } = req.body;
    if (!context) {
      return res
        .status(400)
        .json({ error: "context is required in the request body" });
    }

    const prompt = `Based on the following information about a person, create a meal plan for them: ${context}`;
    const result = await model.generateContent(prompt);

    console.log(result.response.text());
    res.json({ plan: result.response.text() });
  } catch (error) {
    console.error("Error processing the request:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});

api.post("/get-description", async (req, res) => {
  try {
    const { context } = req.body;
    if (!context) {
      return res
        .status(400)
        .json({ error: "context is required in the request body" });
    }

    const prompt = `Based on the following ingredients and food name, generate a description of the dish around 10-20 words: ${context}`;
    const result = await model.generateContent(prompt);

    console.log(result.response.text());
    res.json({ plan: result.response.text() });
  } catch (error) {
    console.error("Error processing the request:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing the request" });
  }
});

api.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}/`);
});
