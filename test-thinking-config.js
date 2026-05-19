/* eslint-disable @typescript-eslint/no-require-imports */
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function getDirectResponse() {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemma-4-26b-a4b-it', // Using the model from the project
      generationConfig: {
        temperature: 0.7,
        // @ts-ignore - checking if this works
        thinkingConfig: {
          thinkingLevel: 'minimal'
        },
      }
    });

    const response = await model.generateContent("Explain Docker in simple terms.");
    console.log("RESPONSE:", response.response.text());
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

getDirectResponse();
