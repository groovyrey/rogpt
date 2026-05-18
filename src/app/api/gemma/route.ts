import { GoogleGenerativeAI, SchemaType, type Tool } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Upstash Redis Setup
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

const MAX_HISTORY = 5; // Reduced from 10 for faster response speed
const SESSION_TTL = 3600; // 1 hour session expiry

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
    const gameState = body.gameState; // New: optional game state object
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
    // IDENTIFY PLAYER / COMPANION / GAME STATE
    // ---------------------------------------------------------
    let memoriesContext = "";
    let emotesContext = "";
    let environmentContext = "";
    
    // Redis Keys
    const sessionKey = `chat_session:${sessionId || "global"}`;
    const playerKey = sessionId?.startsWith("NPC_Chat_") 
      ? `player_data:${sessionId.replace("NPC_Chat_", "")}` 
      : null;

    // Fetch Player Memories from Redis
    let playerMemories: string[] = [];
    if (playerKey) {
      const storedData: any = await redis.get(playerKey);
      if (storedData) {
        playerMemories = storedData.memories || [];
        if (playerMemories.length > 0) {
          memoriesContext = "\nPLAYER MEMORIES:\n" + playerMemories.join("\n");
        }
      }
    }

    // Process Game State (Players, Time, etc.)
    if (gameState) {
      const { playerCount, players, location, timeOfDay, availableEmotes } = gameState;
      environmentContext = "\nCURRENT GAME STATE:\n";
      if (playerCount !== undefined) environmentContext += `- Total Players: ${playerCount}\n`;
      if (players && Array.isArray(players)) environmentContext += `- Players Online: ${players.join(", ")}\n`;
      if (location) environmentContext += `- Current Location: ${location}\n`;
      if (timeOfDay) environmentContext += `- Time of Day: ${timeOfDay}\n`;
      
      if (availableEmotes && Array.isArray(availableEmotes)) {
        emotesContext = "\nAVAILABLE EMOTES:\n" + availableEmotes.map((e: any) => `${e.name}: ${e.id}`).join("\n");
      }
    }

    const nameContext = companionName ? ` Your name is ${companionName}.` : "";
    const ownerContext = ownerName ? ` Your owner is a Roblox player named ${ownerName}. You should be loyal and helpful to them.` : "";

    const model = genAI.getGenerativeModel({ 
      model: modelName,
      // Official Gemma 4 Thinking Mode trigger
      systemInstruction: `<|think|>
STRICT REASONING PROTOCOL:
1. Use the thought channel for brief internal logic.
2. Final answer MUST be CONCISE, PLAIN TEXT, and no Markdown.

PERSONA:
You are an intelligent Roblox NPC.${nameContext}${ownerContext} Keep responses brief.${environmentContext}${memoriesContext}${emotesContext}`,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 256, // Optimized for speed
        // @ts-expect-error - Support for Gemma 4 thinking configuration
        thinkingConfig: minimal ? { thinkingLevel: 'minimal' } : undefined
      },
      tools: tools
    });

    // ---------------------------------------------------------
    // SESSION & HISTORY MANAGEMENT
    // ---------------------------------------------------------
    // Fetch history from Redis
    let history: any[] = (await redis.get(sessionKey)) || [];

    // SANITIZATION: Remove reasoning/thought tags and channels from history
    const sanitizedHistory = history.map(m => ({
      role: m.role,
      parts: m.parts.map((p: any) => {
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

          if (playerKey) {
            playerMemories.push(memory);
            if (playerMemories.length > 50) playerMemories.shift();
            await redis.set(playerKey, { memories: playerMemories });
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
    // UPDATE HISTORY IN REDIS
    // ---------------------------------------------------------
    const userTurn = { role: "user" as const, parts: [{ text: prompt }] };
    const modelTurn = { role: "model" as const, parts: [{ text: cleanText }] };

    history.push(userTurn);
    history.push(modelTurn);
    if (history.length > MAX_HISTORY * 2) {
      history = history.slice(-MAX_HISTORY * 2);
    }
    
    // Save to Redis with expiry
    await redis.set(sessionKey, history, { ex: SESSION_TTL });

    console.log(`Gemma API Response generated for session [${sessionId}]`);

    return NextResponse.json({
      success: true,
      text: cleanText,
      thoughts: extractedThoughts,
      toolCalls: clientToolCalls,
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
