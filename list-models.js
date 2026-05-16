const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("API Key not found in .env.local");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // Note: The SDK might not have a direct listModels on the main class 
    // depending on the version, but usually we can check via the API.
    // However, the standard way to check what works is to try a request 
    // or use the 'listModels' method if available in this SDK version.
    
    // Let's try to just use the exact name the user provided first.
    // If the user says "gemma-4-26b", I should try exactly that.
    
    const modelName = "gemma-4-26b";
    console.log(`Testing user-specified model: ${modelName}`);
    
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello!");
    const response = await result.response;
    console.log("Success with model name:", modelName);
    console.log("Response:", response.text());
  } catch (error) {
    console.error(`Error with model ${error.message}`);
    
    // If it fails, let's try a common variant like "gemma-4b" or "gemma-26b"
    // but the user was very specific about "gemma 4 26b".
  }
}

listModels();
