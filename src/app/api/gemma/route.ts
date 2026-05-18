import { GoogleGenerativeAI, SchemaType, type Tool } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export const runtime = 'nodejs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
      },
      {
        name: "get_player_info",
        description: "Get detailed information about all players currently in the server, including their health, distance, and activity.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {}
        }
      }
    ]
  }
];

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    const secret = process.env.ROBLOX_API_KEY || "roblox-to-gpt-secret-123";
    
    if (authHeader !== `Bearer ${secret}`) {
      console.warn("Unauthorized request attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const prompt = body.prompt;
    const sessionId = body.sessionId;
    const companionName = body.companionName;
    const ownerName = body.ownerName;
    const gameState = body.gameState; 
    const minimal = body.minimal !== undefined ? body.minimal : true;
    const incomingHistory = body.history;

    console.log(`Gemma API Request for session [${sessionId}] with prompt:`, prompt, minimal ? "(Minimal Mode)" : "");

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return NextResponse.json({ error: "API configuration error" }, { status: 500 });
    }

    // Using gemma-4-31b-it as requested
    const modelName = "gemma-4-31b-it";
    
    // ---------------------------------------------------------
    // IDENTIFY PLAYER / COMPANION / GAME STATE
    // ---------------------------------------------------------
    let memoriesContext = "";
    let emotesContext = "";
    let environmentContext = "";
    
    const sessionKey = `chat_session:${sessionId || "global"}`;
    const playerKey = sessionId?.startsWith("NPC_Chat_") 
      ? `player_data:${sessionId.replace("NPC_Chat_", "")}` 
      : null;

    // Fetch Player Memories from Redis
    let playerMemories: string[] = [];
    if (playerKey && redis) {
      try {
        const storedData: any = await redis.get(playerKey);
        if (storedData) {
          playerMemories = storedData.memories || [];
          if (playerMemories.length > 0) {
            memoriesContext = "\nPLAYER MEMORIES:\n" + playerMemories.join("\n");
          }
        }
      } catch (redisError) {
        console.error("Redis Error (fetching memories):", redisError);
      }
    }

    // Process Game State (Brief version for system prompt)
    if (gameState) {
      const { playerCount, location, timeOfDay, availableEmotes } = gameState;
      environmentContext = "\nCURRENT GAME STATE:\n";
      if (playerCount !== undefined) environmentContext += `- Total Players: ${playerCount}\n`;
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
      systemInstruction: `<|think|>
STRICT REASONING PROTOCOL:
1. Use the thought channel for brief internal logic.
2. Final answer MUST be CONCISE, PLAIN TEXT, and no Markdown.

PERSONA:
You are an intelligent Roblox NPC.${nameContext}${ownerContext}
- ALWAYS provide a NEW, UNIQUE text response for every prompt.
- Acknowledge the player's latest message specifically.
- MANDATORY: If the player tells you a new fact about themselves (like a nickname, preference, or goal), you MUST use the 'save_memory' tool immediately.
- If 'PLAYER MEMORIES' contains a preferred name or nickname, use that instead of the 'ownerName' (Roblox username).
- If you use a tool (like play_emote or save_memory), describe your action or respond to the player while doing it.
- NEVER repeat previous information unless specifically asked.
- Keep responses brief (1-3 sentences).
- Use get_player_info if you need to know what other players are doing or their health status.${environmentContext}${memoriesContext}${emotesContext}`,
      generationConfig: {
        temperature: 0.9, // Higher variety to prevent repetition
        topK: 50,
        topP: 0.95,
        maxOutputTokens: 256,
        // @ts-expect-error - Support for Gemma 4 thinking configuration
        thinkingConfig: minimal ? { thinkingLevel: 'minimal' } : undefined
      },
      tools: tools
    });

    // ---------------------------------------------------------
    // SESSION & HISTORY MANAGEMENT
    // ---------------------------------------------------------
    let history: any[] = [];
    if (Array.isArray(incomingHistory)) {
      history = incomingHistory;
    } else if (redis) {
      try {
        const storedHistory = await redis.get(sessionKey);
        if (Array.isArray(storedHistory)) {
          history = storedHistory;
        }
      } catch (redisError) {
        console.error("Redis Error (fetching history):", redisError);
      }
    }

    // SANITIZATION: Remove reasoning/thought tags and channels from history
    const sanitizedHistory = history
      .filter(m => m && typeof m === "object" && m.role && Array.isArray(m.parts))
      .map(m => ({
        role: m.role,
        parts: m.parts.map((p: any) => {
          if (p && typeof p === "object" && p.text) {
            return {
              text: p.text.replace(/<\|channel>thought[\s\S]*?(?:<channel\|>|$)/gi, '')
                          .replace(/<(thought|think|reasoning)>[\s\S]*?(?:<\/\1>|$)/gi, '')
                          .replace(/<\|channel>[\s\S]*?(?:<channel\|>|$)/gi, '')
                          .replace(/<\|[\s\S]*?\|>/gi, "")
                          .trim()
            };
          }
          return p;
        }).filter((p: any) => p && typeof p === "object")
      }));

    // CRITICAL: Google SDK requires history to start with role 'user'
    while (sanitizedHistory.length > 0 && sanitizedHistory[0].role !== "user") {
      console.log(`[Session ${sessionId}] Dropping leading ${sanitizedHistory[0].role} message for SDK compliance`);
      sanitizedHistory.shift();
    }

    // ---------------------------------------------------------
    // STATELESS GENERATION (Robust & Professional)
    // ---------------------------------------------------------
    // We use generateContent with the full history + current prompt 
    // instead of the stateful startChat/sendMessage to prevent desync bugs.
    
    const contents = [
      ...sanitizedHistory,
      { role: "user", parts: [{ text: prompt }] }
    ];

    let result;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    const INITIAL_RETRY_DELAY = 1000;

    while (retryCount <= MAX_RETRIES) {
      try {
        // Use generateContent for a completely stateless request
        const generationResult = await model.generateContent({
          contents: contents,
        });
        result = generationResult;
        break; // Success
      } catch (aiError: any) {
        retryCount++;
        if (retryCount > MAX_RETRIES) {
          console.error("AI Generation Error (Max Retries Exceeded):", aiError);
          return NextResponse.json({ error: "AI service failed after multiple retries: " + (aiError.message || "Unknown error") }, { status: 500 });
        }
        
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount - 1);
        console.warn(`AI Generation Error (Attempt ${retryCount}): ${aiError.message}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    let response = result?.response;
    if (!response) {
      throw new Error("No response received from AI model");
    }
    
    // ---------------------------------------------------------
    // TOOL EXECUTION LOOP & TEXT ACCUMULATION
    // ---------------------------------------------------------
    const clientToolCalls: any[] = [];
    let fullText = "";
    let extractedThoughts = "";
    
    const processResponseParts = (resp: any) => {
      const candidates = resp.candidates || [];
      for (const candidate of candidates) {
        const parts = candidate.content?.parts || [];
        for (const part of parts) {
          if ((part as any).thought) {
            const thoughtText = (part as any).text || (part as any).thought;
            if (typeof thoughtText === 'string') extractedThoughts += thoughtText;
          } else if (part.text) {
            fullText += part.text;
          }
        }
      }
    };

    // Process initial response
    processResponseParts(response);

    let functionCalls = response.functionCalls() || [];
    let loopCount = 0;
    const MAX_TOOL_LOOPS = 3;

    while (functionCalls.length > 0 && loopCount < MAX_TOOL_LOOPS) {
      loopCount++;
      const toolResponses: any[] = [];

      for (const call of functionCalls) {
        if (call.name === "save_memory") {
          const memory = (call.args as any).memory;
          console.log(`[Session ${sessionId}] AI wants to save memory:`, memory);
          let isDuplicate = false;

          if (playerKey && redis) {
            // Check for duplicates (case-insensitive and trimmed)
            isDuplicate = playerMemories.some(m => m.toLowerCase().trim() === memory.toLowerCase().trim());
            
            if (!isDuplicate) {
              playerMemories.push(memory);
              if (playerMemories.length > 50) playerMemories.shift();
              try {
                await redis.set(playerKey, { memories: playerMemories });
              } catch (redisError) {
                console.error("Redis Error (saving memory):", redisError);
              }
            } else {
              console.log(`[Session ${sessionId}] Skipping duplicate memory:`, memory);
            }
          }

          toolResponses.push({
            functionResponse: {
              name: "save_memory",
              response: { content: isDuplicate ? "Memory already known." : "Memory successfully saved." }
            }
          });
        } else if (call.name === "play_emote") {
          const emoteId = (call.args as any).emoteId;
          const isDuplicate = clientToolCalls.some(c => c.name === "play_emote" && (c.args as any).emoteId === emoteId);

          if (!isDuplicate) {
            console.log(`[Session ${sessionId}] AI wants to play emote:`, emoteId);
            clientToolCalls.push(call);
            toolResponses.push({
              functionResponse: {
                name: "play_emote",
                response: { content: "Emote triggered successfully." }
              }
            });
          } else {
            toolResponses.push({
              functionResponse: {
                name: "play_emote",
                response: { content: "Emote is already playing. Move on to your response." }
              }
            });
          }
        } else if (call.name === "get_player_info") {
          console.log(`[Session ${sessionId}] AI requested player info.`);
          const playersInfo = gameState?.players || [];
          
          toolResponses.push({
            functionResponse: {
              name: "get_player_info",
              response: { players: playersInfo }
            }
          });
        } else {
          // Fallback for unhandled or hallucinated tools
          console.warn(`[Session ${sessionId}] AI called unknown tool: ${call.name}`);
          toolResponses.push({
            functionResponse: {
              name: call.name,
              response: { error: "This tool is not supported or currently unavailable." }
            }
          });
        }
      }

      if (toolResponses.length > 0) {
        try {
          // Add the model's tool calls and our responses to the conversation
          contents.push(response.candidates![0].content);
          contents.push({ role: "function", parts: toolResponses });

          const toolResult = await model.generateContent({ contents });
          response = toolResult.response;
          processResponseParts(response); 
          functionCalls = response.functionCalls() || [];
        } catch (toolResponseError) {
          console.error("Error during tool response:", toolResponseError);
          break;
        }
      } else {
        break;
      }
    }

    // ---------------------------------------------------------
    // FINAL RESPONSE PROCESSING
    // ---------------------------------------------------------
    if (!extractedThoughts) {
      const channelMatch = fullText.match(/<\|channel>thought([\s\S]*?)(?:<channel\|>|$)/i);
      if (channelMatch) extractedThoughts = channelMatch[1].trim();
      else {
        const thoughtMatch = fullText.match(/<(thought|think|reasoning)>([\s\S]*?)(?:<\/\1>|$)/i);
        if (thoughtMatch) extractedThoughts = thoughtMatch[2].trim();
      }
    }

    let cleanText = fullText.replace(/<\|channel>thought[\s\S]*?(?:<channel\|>|$)/gi, "")
                            .replace(/<(thought|think|reasoning)>[\s\S]*?(?:<\/\1>|$)/gi, "")
                            .replace(/<\|channel>[\s\S]*?(?:<channel\|>|$)/gi, "")
                            .replace(/<\|[\s\S]*?\|>/gi, "")
                            .trim();

    if (!cleanText && fullText) cleanText = fullText.trim();

    if (extractedThoughts) {
      console.log(`[Session ${sessionId}] Gemma Thoughts:`, extractedThoughts);
    }

    // ---------------------------------------------------------
    // UPDATE HISTORY IN REDIS (Keep as sync point for other tools/UIs)
    // ---------------------------------------------------------
    if (redis) {
      const userTurn = { role: "user" as const, parts: [{ text: prompt }] };
      const modelTurn = { role: "model" as const, parts: [{ text: cleanText }] };

      let currentHistory: any[] = incomingHistory || [];
      if (!incomingHistory) {
        const stored = await redis.get(sessionKey);
        if (Array.isArray(stored)) currentHistory = stored;
      }

      currentHistory.push(userTurn);
      currentHistory.push(modelTurn);
      if (currentHistory.length > MAX_HISTORY * 2) {
        currentHistory = currentHistory.slice(-MAX_HISTORY * 2);
      }
      
      try {
        await redis.set(sessionKey, currentHistory, { ex: SESSION_TTL });
      } catch (redisError) {
        console.error("Redis Error (saving history):", redisError);
      }
    }

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
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
