import { GoogleGenerativeAI, SchemaType, type Tool } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { cachedDataStore } from "../datastore/store";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// In-memory store for non-player sessions
const globalChatSessions: Record<string, any[]> = {};
const MAX_HISTORY = 10; // 10 exchanges = 20 messages

// ---------------------------------------------------------
// TOOL DEFINITIONS
// ---------------------------------------------------------
const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "save_memory",
        description: "Save a persistent memory or fact about the player to their DataStore for long-term recall.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            memory: {
              type: SchemaType.STRING,
              description: "The fact or information to remember about the player (e.g., 'Player likes blue', 'Player's name is Alex')."
            }
          },
          required: ["memory"]
        }
      },
      {
        name: "play_emote",
        description: "Play a specific animation or emote on the NPC character.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            emoteId: {
              type: SchemaType.STRING,
              description: "The Roblox asset ID of the emote to play (e.g., 'rbxassetid://123456')."
            }
          },
          required: ["emoteId"]
        }
      }
    ]
  }
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const prompt = body.prompt;
    const sessionId = body.sessionId;
    const companionName = body.companionName;
    const ownerName = body.ownerName;
    // Default to true if not provided (Roblox), but allow explicit false (Test Page)
    const minimal = body.minimal !== undefined ? body.minimal : true;

    console.log(`Gemma API Request for session [${sessionId}] with prompt:`, prompt, minimal ? "(Minimal Mode)" : "");

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
    
    // ---------------------------------------------------------
    // IDENTIFY PLAYER / COMPANION
    // ---------------------------------------------------------
    let isCompanionDataStore = false;
    let companionKey = "";
    let memoriesContext = "";
    let emotesContext = "";

    if (sessionId && sessionId.startsWith("NPC_Chat_")) {
      const userId = sessionId.replace("NPC_Chat_", "");
      companionKey = `Companion_${userId}`; // Using the new dedicated Companion DataStore key
      const companionData = cachedDataStore[companionKey];

      if (companionData) {
        isCompanionDataStore = true;
        if (companionData.memories && companionData.memories.length > 0) {
          memoriesContext = "\nPLAYER MEMORIES:\n" + companionData.memories.join("\n");
        }
        if (companionData.emotes && companionData.emotes.length > 0) {
          emotesContext = "\nAVAILABLE EMOTES:\n" + companionData.emotes.map((e: any) => `${e.name}: ${e.id}`).join("\n");
        }
      }
    }

    const nameContext = companionName ? ` Your name is ${companionName}.` : "";
    const ownerContext = ownerName ? ` Your owner is a Roblox player named ${ownerName}. You should be loyal and helpful to them.` : "";

    const model = genAI.getGenerativeModel({ 
      model: modelName,
      // Official Gemma 4 Thinking Mode trigger
      systemInstruction: `<|think|>
STRICT REASONING PROTOCOL:
1. Your reasoning will be captured in a thought channel.
2. Everything outside the thought channel MUST be the final, user-facing answer in PLAIN TEXT. Do not use Markdown formatting.

PERSONA:
You are an intelligent NPC in a Roblox game.${nameContext}${ownerContext} You have the ability to save memories about the player you are talking to, and you can play emotes to express yourself.
If you learn something important about the player, use the 'save_memory' tool.
If the player asks you to dance, wave, or do an action, or if you want to express yourself physically, use the 'play_emote' tool with the correct ID from the list below.${memoriesContext}${emotesContext}`,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        // @ts-expect-error - Support for Gemma 4 thinking configuration
        thinkingConfig: minimal ? { thinkingLevel: 'minimal' } : undefined
      },
      tools: tools
    });

    // ---------------------------------------------------------
    // SESSION & HISTORY MANAGEMENT
    // ---------------------------------------------------------
    let history: { role: "user" | "model" | "function", parts: any[] }[] = [];

    if (isCompanionDataStore && cachedDataStore[companionKey]) {
      history = cachedDataStore[companionKey].chat_history || [];
    } else {
      const sid = sessionId || "global";
      if (!globalChatSessions[sid]) {
        globalChatSessions[sid] = [];
      }
      history = globalChatSessions[sid];
    }

    // SANITIZATION: Remove reasoning/thought tags and channels from history
    const sanitizedHistory = history.map(m => ({
      role: m.role,
      parts: m.parts.map(p => {
        if (p.text) {
          return {
            text: p.text.replace(/<\|channel>thought[\s\S]*?(?:<channel\|>|$)/gi, '')
                        .replace(/<(thought|think|reasoning)>[\s\S]*?(?:<\/\1>|$)/gi, '')
                        .trim()
          };
        }
        return p;
      })
    }));

    // Start chat with sanitized history
    const chat = model.startChat({
      history: sanitizedHistory,
    });

    let result = await chat.sendMessage(prompt);
    let response = await result.response;
    
    // ---------------------------------------------------------
    // TOOL EXECUTION LOOP
    // ---------------------------------------------------------
    const clientToolCalls: any[] = [];
    let functionCalls = response.functionCalls() || [];

    while (functionCalls.length > 0) {
      const toolResponses: any[] = [];

      for (const call of functionCalls) {
        if (call.name === "save_memory") {
          const memory = (call.args as any).memory;
          console.log(`[Session ${sessionId}] AI wants to save memory:`, memory);

          if (isCompanionDataStore && cachedDataStore[companionKey]) {
            if (!cachedDataStore[companionKey].memories) cachedDataStore[companionKey].memories = [];
            cachedDataStore[companionKey].memories.push(memory);
            if (cachedDataStore[companionKey].memories.length > 50) cachedDataStore[companionKey].memories.shift();
          }

          toolResponses.push({
            functionResponse: {
              name: "save_memory",
              response: { content: "Memory successfully saved." }
            }
          });
        } else if (call.name === "play_emote") {
          console.log(`[Session ${sessionId}] AI wants to play emote:`, (call.args as any).emoteId);
          clientToolCalls.push(call);
          
          toolResponses.push({
            functionResponse: {
              name: "play_emote",
              response: { content: "Emote triggered successfully." }
            }
          });
        }
      }

      if (toolResponses.length > 0) {
        result = await chat.sendMessage(toolResponses);
        response = await result.response;
        functionCalls = response.functionCalls() || [];
      } else {
        break;
      }
    }

    // ---------------------------------------------------------
    // RESPONSE PROCESSING
    // ---------------------------------------------------------
    let fullText = "";
    let extractedThoughts = "";
    let cleanText = "";

    const candidates = response.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if ((part as any).thought) {
          const thoughtText = (part as any).text || (part as any).thought;
          if (typeof thoughtText === 'string') {
            extractedThoughts += thoughtText;
          }
        } else if (part.text) {
          fullText += part.text;
        }
      }
    }

    if (!extractedThoughts) {
      const channelMatch = fullText.match(/<\|channel>thought([\s\S]*?)(?:<channel\|>|$)/i);
      if (channelMatch) {
        extractedThoughts = channelMatch[1].trim();
      } else {
        const thoughtMatch = fullText.match(/<(thought|think|reasoning)>([\s\S]*?)(?:<\/\1>|$)/i);
        if (thoughtMatch) {
          extractedThoughts = thoughtMatch[2].trim();
        }
      }
    }

    cleanText = fullText.replace(/<\|channel>thought[\s\S]*?(?:<channel\|>|$)/gi, "")
                        .replace(/<(thought|think|reasoning)>[\s\S]*?(?:<\/\1>|$)/gi, "")
                        .trim();

    if (!cleanText && fullText) {
      cleanText = fullText.trim();
    }

    if (extractedThoughts) {
      console.log(`[Session ${sessionId}] Gemma Thoughts:`, extractedThoughts);
    }

    // ---------------------------------------------------------
    // UPDATE HISTORY
    // ---------------------------------------------------------
    const userTurn = { role: "user" as const, parts: [{ text: prompt }] };
    const modelTurn = { role: "model" as const, parts: [{ text: cleanText }] };

    if (isCompanionDataStore && cachedDataStore[companionKey]) {
      if (!cachedDataStore[companionKey].chat_history) cachedDataStore[companionKey].chat_history = [];
      cachedDataStore[companionKey].chat_history.push(userTurn);
      cachedDataStore[companionKey].chat_history.push(modelTurn);
      if (cachedDataStore[companionKey].chat_history.length > MAX_HISTORY * 2) {
        cachedDataStore[companionKey].chat_history = cachedDataStore[companionKey].chat_history.slice(-MAX_HISTORY * 2);
      }
    } else {
      const sid = sessionId || "global";
      globalChatSessions[sid].push(userTurn);
      globalChatSessions[sid].push(modelTurn);
      if (globalChatSessions[sid].length > MAX_HISTORY * 2) {
        globalChatSessions[sid] = globalChatSessions[sid].slice(-MAX_HISTORY * 2);
      }
    }

    console.log(`Gemma API Response generated for session [${sessionId}]`);

    return NextResponse.json({
      success: true,
      text: cleanText,
      thoughts: extractedThoughts,
      toolCalls: clientToolCalls,
      updatedData: isCompanionDataStore ? cachedDataStore[companionKey] : null
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
