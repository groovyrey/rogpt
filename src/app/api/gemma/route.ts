import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    console.log("Gemma API Request received with prompt:", prompt);

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 }
      );
    }

    // Strictly using gemma-4-26b-a4b-it as requested
    const modelName = "gemma-4-26b-a4b-it";
    console.log("Using model:", modelName);
    
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      systemInstruction: "Respond directly. Do not use <thought> or <thinking> tags. Provide only the final answer.",
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Programmatically strip <thought> or <thinking> blocks if they still appear
    text = text.replace(/<(thought|thinking)>[\s\S]*?<\/\1>/gi, "").trim();

    console.log("Gemma API Response generated and cleaned");

    return NextResponse.json({
      success: true,
      text: text,
    });
  } catch (error: any) {
    console.error("Gemma API Error Detail:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: error.message || "Failed to generate content" },
      { status: 500 }
    );
  }
}
