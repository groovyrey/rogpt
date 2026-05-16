const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Using API Key:", apiKey ? "FOUND" : "NOT FOUND");
  
  if (!apiKey) return;

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = "gemma-2-27b";
  console.log("Testing model:", modelName);

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello!");
    const response = await result.response;
    console.log("Success! Response:", response.text());
  } catch (error) {
    console.error("Error testing model:", error.message);
    
    console.log("Attempting fallback to gemini-1.5-flash...");
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("Hello!");
      const response = await result.response;
      console.log("Success with Gemini! Response:", response.text());
    } catch (err2) {
      console.error("Error testing fallback:", err2.message);
    }
  }
}

test();
