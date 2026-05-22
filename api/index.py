import os
import time
import json
import re
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Header, Request, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import google.generativeai as genai
from upstash_redis import Redis

# Load environment variables
load_dotenv()

app = FastAPI(
    title="rogpt-fastapi",
    description="Refactored rogpt server using FastAPI",
    version="1.0.0",
)

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ROBLOX_API_KEY = os.getenv("ROBLOX_API_KEY", "roblox-to-gpt-secret-123")
REDIS_URL = os.getenv("UPSTASH_REDIS_REST_URL")
REDIS_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not set.")

# Initialize Gemini
genai.configure(api_key=GEMINI_API_KEY)

# Initialize Redis
redis = None
if REDIS_URL and REDIS_TOKEN:
    redis = Redis(url=REDIS_URL, token=REDIS_TOKEN)

# --- Models ---

class Emote(BaseModel):
    name: str
    id: str

class GameState(BaseModel):
    playerCount: Optional[int] = None
    location: Optional[str] = None
    timeOfDay: Optional[str] = None
    availableEmotes: Optional[List[Emote]] = None
    availableTools: Optional[List[str]] = None
    players: Optional[List[Dict[str, Any]]] = None

class GemmaRequest(BaseModel):
    prompt: str
    sessionId: str
    companionName: Optional[str] = None
    ownerName: Optional[str] = None
    ownerUserId: Optional[str] = None
    gameState: Optional[GameState] = None
    minimal: bool = True
    history: Optional[List[Dict[str, Any]]] = None

# --- Tool Definitions ---

def save_memory(memory: str):
    """
    Save a persistent memory or fact about the player to their DataStore for long-term recall.
    """
    # This is handled in the execution loop to interact with Redis
    return {"status": "request_received"}

def play_emote(emoteId: str):
    """
    Play a specific animation or emote on the NPC character.
    """
    return {"status": "request_received"}

def get_player_info():
    """
    Get detailed information about all players currently in the server.
    """
    return {"status": "request_received"}

def give_tool(toolName: str):
    """
    Give a specific tool or item to the player from the server's storage.
    """
    return {"status": "request_received"}

# --- Helper Functions ---

def sanitize_history(history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    sanitized = []
    for m in history:
        if not isinstance(m, dict) or "role" not in m or "parts" not in m:
            continue
        
        parts = []
        for p in m["parts"]:
            if isinstance(p, dict) and "text" in p:
                text = p["text"]
                # Remove thought tags
                text = re.sub(r'<\|channel>thought[\s\S]*?(?:<channel\|>|$)', '', text, flags=re.IGNORECASE)
                text = re.sub(r'<(?:thought|think|reasoning)>[\s\S]*?(?:<\/(?:thought|think|reasoning)>|$)', '', text, flags=re.IGNORECASE)
                text = re.sub(r'<\|channel>[\s\S]*?(?:<channel\|>|$)', '', text, flags=re.IGNORECASE)
                text = re.sub(r'<\|[\s\S]*?\|>', '', text)
                parts.append({"text": text.strip()})
            else:
                parts.append(p)
        
        sanitized.append({"role": m["role"], "parts": parts})
    
    # Ensure starts with user
    while sanitized and sanitized[0]["role"] != "user":
        sanitized.pop(0)
    
    return sanitized

# --- Endpoints ---

@app.get("/", response_class=HTMLResponse)
async def root():
    return """
    <html>
        <head><title>rogpt-fastapi</title></head>
        <body style="background:#000; color:#fff; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh;">
            <div style="text-align:center; border:1px solid #333; padding:2rem; border-radius:12px;">
                <h1>rogpt-fastapi</h1>
                <p>Status: <span style="color:#0f0;">Online</span></p>
                <p>Ready for Roblox AI requests.</p>
            </div>
        </body>
    </html>
    """

@app.post("/api/gemma")
async def gemma_endpoint(
    req: GemmaRequest,
    authorization: Optional[str] = Header(None)
):
    # Auth Check
    is_authorized = (authorization == f"Bearer {ROBLOX_API_KEY}")
    if not is_authorized:
        # Note: In Next.js it also checked for session, but here we expect Bearer token for Roblox
        raise HTTPException(status_code=401, detail="Unauthorized")

    prompt = req.prompt
    session_id = req.sessionId
    companion_name = req.companionName
    owner_name = req.ownerName
    
    # Identify User
    roblox_user_id = session_id.replace("NPC_Chat_", "") if session_id.startswith("NPC_Chat_") else None
    user_id = req.ownerUserId or roblox_user_id
    
    custom_persona = ""
    player_memories = []
    
    # Redis Data Fetching
    if user_id and redis:
        try:
            # Companion Config
            saved_config = redis.get(f"companion_config:{user_id}")
            if saved_config:
                if isinstance(saved_config, str): saved_config = json.loads(saved_config)
                if saved_config.get("name"): companion_name = saved_config["name"]
                if saved_config.get("ownerName"): owner_name = saved_config["ownerName"]
                if saved_config.get("persona"): 
                    custom_persona = f"\nCUSTOM INSTRUCTIONS:\n{saved_config['persona']}\n"
            
            # Player Memories
            stored_player_data = redis.get(f"player_data:{user_id}")
            if stored_player_data:
                if isinstance(stored_player_data, str): stored_player_data = json.loads(stored_player_data)
                player_memories = stored_player_data.get("memories", [])
        except Exception as e:
            print(f"Redis Error: {e}")

    # Build Context
    memories_context = f"\nPLAYER MEMORIES:\n" + "\n".join(player_memories) if player_memories else ""
    environment_context = ""
    emotes_context = ""
    tools_context = ""
    
    if req.gameState:
        gs = req.gameState
        environment_context = "\nCURRENT GAME STATE:\n"
        if gs.playerCount is not None: environment_context += f"- Total Players: {gs.playerCount}\n"
        if gs.location: environment_context += f"- Current Location: {gs.location}\n"
        if gs.timeOfDay: environment_context += f"- Time of Day: {gs.timeOfDay}\n"
        
        if gs.availableEmotes:
            emotes_context = "\nAVAILABLE EMOTES:\n" + "\n".join([f"{e.name}: {e.id}" for e in gs.availableEmotes])
        
        if gs.availableTools:
            tools_context = "\nAVAILABLE TOOLS (You can give these to the player):\n" + ", ".join(gs.availableTools)

    name_context = f" Your name is {companion_name}." if companion_name else ""
    owner_context = f" Your owner is a Roblox player named {owner_name}. You should be loyal and helpful to them." if owner_name else ""

    system_instruction = f"""<|think|>
STRICT REASONING PROTOCOL:
1. Use the thought channel for brief internal logic.
2. Final answer MUST be CONCISE, PLAIN TEXT, and no Markdown.

PERSONA:
You are an intelligent Roblox NPC.{name_context}{owner_context}{custom_persona}
- ALWAYS provide a NEW, UNIQUE text response for every prompt.
- Acknowledge the player's latest message specifically.
- MANDATORY: If the player tells you a new fact about themselves (like a nickname, preference, or goal), you MUST use the 'save_memory' tool immediately.
- If the player asks for an item or tool, use the 'give_tool' function with the requested tool name.
- If 'PLAYER MEMORIES' contains a preferred name or nickname, use that instead of the 'ownerName' (Roblox username).
- If you use a tool (like play_emote or save_memory), describe your action or respond to the player while doing it.
- NEVER repeat previous information unless specifically asked.
- Keep responses brief (1-3 sentences).
- Use get_player_info if you need to know what other players are doing or their health status.{environment_context}{memories_context}{emotes_context}{tools_context}"""

    # Model Setup
    model_name = "gemma-4-31b-it"
    fallback_model_name = "gemma-4-26b-a4b-it"
    
    generation_config = {
        "temperature": 0.9,
        "top_p": 0.95,
        "max_output_tokens": 256,
        "thinking_config": {
            "include_thoughts": True,
            "thinking_level": "MINIMAL" if req.minimal else "MEDIUM"
        }
    }

    model = genai.GenerativeModel(
        model_name=model_name,
        system_instruction=system_instruction,
        generation_config=generation_config,
        tools=[save_memory, play_emote, get_player_info, give_tool]
    )

    # History Management
    session_key = f"chat_session:user_{user_id}" if user_id else f"chat_session:{session_id}"
    
    history = req.history or []
    if not history and redis:
        try:
            stored_history = redis.get(session_key)
            if stored_history:
                if isinstance(stored_history, str): history = json.loads(stored_history)
                else: history = stored_history
        except Exception as e:
            print(f"Redis History Error: {e}")

    sanitized_history = sanitize_history(history)
    
    # Generate Content
    chat = model.start_chat(history=sanitized_history)
    
    full_text = ""
    extracted_thoughts = ""
    client_tool_calls = []
    
    try:
        response = chat.send_message(prompt)
        
        # Tool execution loop (FastAPI/Python SDK handles this differently, but we can process the response)
        # The Python SDK can automatically handle tool calling if we use a helper, 
        # but here we follow the user's manual loop logic for specific side effects (Redis).
        
        loop_count = 0
        MAX_TOOL_LOOPS = 3
        
        while loop_count < MAX_TOOL_LOOPS:
            loop_count += 1
            
            # Extract text and thoughts
            if hasattr(response, 'candidates') and response.candidates:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, 'thought') and part.thought:
                        extracted_thoughts += (part.text or part.thought)
                    elif part.text:
                        full_text += part.text
            
            # Process function calls
            function_calls = [p.function_call for p in response.candidates[0].content.parts if p.function_call]
            if not function_calls:
                break
                
            tool_responses = []
            for call in function_calls:
                name = call.name
                args = dict(call.args)
                
                if name == "save_memory":
                    memory = args.get("memory", "")
                    print(f"Saving memory: {memory}")
                    is_duplicate = any(m.lower().strip() == memory.lower().strip() for m in player_memories)
                    if not is_duplicate and user_id and redis:
                        player_memories.append(memory)
                        if len(player_memories) > 50: player_memories.pop(0)
                        redis.set(f"player_data:{user_id}", json.dumps({"memories": player_memories}))
                        res_content = "Memory successfully saved."
                    else:
                        res_content = "Memory already known."
                    tool_responses.append({"name": name, "response": {"content": res_content}})
                
                elif name == "play_emote":
                    emote_id = args.get("emoteId", "")
                    client_tool_calls.append({"name": name, "args": args})
                    tool_responses.append({"name": name, "response": {"content": "Emote triggered successfully."}})
                
                elif name == "give_tool":
                    tool_name = args.get("toolName", "")
                    client_tool_calls.append({"name": name, "args": args})
                    tool_responses.append({"name": name, "response": {"content": f"Tool '{tool_name}' requested."}})
                
                elif name == "get_player_info":
                    players = req.gameState.players if req.gameState else []
                    tool_responses.append({"name": name, "response": {"players": players}})

            # Send tool responses back
            response = chat.send_message([
                genai.protos.Part(
                    function_response=genai.protos.FunctionResponse(
                        name=r["name"],
                        response=r["response"]
                    )
                ) for r in tool_responses
            ])

    except Exception as e:
        print(f"AI Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    # Clean up output
    # Thoughts extraction
    extracted_thoughts = ""
    
    # Try multiple patterns for thoughts
    t_match = re.search(r'<\|channel>thought([\s\S]*?)(?:<channel\|>|$)', full_text, re.IGNORECASE)
    if not t_match:
        t_match = re.search(r'<(?:thought|think|reasoning)>([\s\S]*?)(?:<\/(?:thought|think|reasoning)>|$)', full_text, re.IGNORECASE)
    
    if t_match:
        extracted_thoughts = t_match.group(1).strip()
    
    # Comprehensive cleaning (matching original route.ts logic)
    clean_text = re.sub(r'<\|channel>thought[\s\S]*?(?:<channel\|>|$)', '', full_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'<(?:thought|think|reasoning)>[\s\S]*?(?:<\/(?:thought|think|reasoning)>|$)', '', clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'<\|channel>[\s\S]*?(?:<channel\|>|$)', '', clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'<\|[\s\S]*?\|>', '', clean_text)
    clean_text = clean_text.strip()

    # If everything was stripped, fallback to the original trimmed text
    if not clean_text and full_text:
        clean_text = full_text.strip()

    # Fallback text
    if not clean_text and client_tool_calls:
        clean_text = "Alright, I've handled that for you."

    # Save History to Redis
    if redis:
        try:
            # chat.history contains the full conversation
            # Convert to list of dicts for JSON serialization
            serializable_history = []
            for m in chat.history:
                parts = []
                for p in m.parts:
                    if p.text: parts.append({"text": p.text})
                    elif p.function_call: 
                        parts.append({"functionCall": {"name": p.function_call.name, "args": dict(p.function_call.args)}})
                    elif p.function_response:
                        parts.append({"functionResponse": {"name": p.function_response.name, "response": dict(p.function_response.response)}})
                serializable_history.append({"role": m.role, "parts": parts})
            
            # Limit history length
            if len(serializable_history) > 20: # 10 turns
                serializable_history = serializable_history[-20:]
                while serializable_history and serializable_history[0]["role"] != "user":
                    serializable_history.pop(0)
            
            redis.set(session_key, json.dumps(serializable_history), ex=3600)
        except Exception as e:
            print(f"Redis Save Error: {e}")

    return {
        "success": True,
        "text": clean_text,
        "thoughts": extracted_thoughts,
        "toolCalls": client_tool_calls
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
