const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function testGemma4() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  const modelName = "gemma-4-26b-a4b-it";
  console.log(`Testing model: ${modelName} with thinkingConfig...`);
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      // @ts-ignore
      generationConfig: {
        thinkingConfig: { thinkingLevel: 'minimal' }
      }
    });

    const result = await model.generateContent("Say hello!");
    const response = await result.response;
    console.log("Success!");
    console.log("Response:", response.text());
  } catch (error) {
    console.error("Error with Gemma 4 and thinkingConfig:", error.message);
    
    console.log("\nRetrying WITHOUT thinkingConfig...");
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello!");
      const response = await result.response;
      console.log("Success WITHOUT thinkingConfig!");
      console.log("Response:", response.text());
    } catch (error2) {
      console.error("Error even without thinkingConfig:", error2.message);
    }
  }
}

testGemma4();
