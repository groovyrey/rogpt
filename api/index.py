import os
import asyncio
import json
import re
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Header, Request, Depends
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import google.genai as genai
from google.genai import types
from upstash_redis.asyncio import Redis

# Load environment variables
load_dotenv()

app = FastAPI(
    title="rogpt-fastapi",
    description="Refactored rogpt server using FastAPI with improvements",
    version="1.1.0",
)

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
ROBLOX_API_KEY = os.getenv("ROBLOX_API_KEY", "roblox-to-gpt-secret-123")
REDIS_URL = os.getenv("UPSTASH_REDIS_REST_URL")
REDIS_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN")

if not GEMINI_API_KEY:
    print("WARNING: GEMINI_API_KEY is not set.")

# Initialize Gemini Client
client = genai.Client(api_key=GEMINI_API_KEY)

# Initialize Redis (Async)
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

class DatastoreRequest(BaseModel):
    action: str # "sync" or "fetch"
    key: str    # e.g., "Player_123"
    value: Optional[Any] = None

# --- Helper Functions ---

async def check_rate_limit(key: str, limit: int = 5, window: int = 60) -> bool:
    """Returns True if rate limit is exceeded."""
    if not redis:
        return False
    try:
        current = await redis.get(f"rate_limit:{key}")
        if current is None:
            await redis.set(f"rate_limit:{key}", 1, ex=window)
            return False
        
        if int(current) >= limit:
            return True
        
        await redis.incr(f"rate_limit:{key}")
        return False
    except Exception as e:
        print(f"Rate Limit Error: {e}")
        return False

def sanitize_history(history: List[Dict[str, Any]]) -> List[types.Content]:
    sanitized = []
    for m in history:
        if not isinstance(m, dict) or "role" not in m or "parts" not in m:
            continue
        
        role = "user" if m["role"] == "user" else "model"
        parts = []
        for p in m["parts"]:
            if isinstance(p, dict):
                if "text" in p:
                    text = p["text"]
                    # Remove thought tags
                    text = re.sub(r'<\|channel>thought[\s\S]*?(?:<channel\|>|$)', '', text, flags=re.IGNORECASE)
                    text = re.sub(r'<(?:thought|think|reasoning)>[\s\S]*?(?:<\/(?:thought|think|reasoning)>|$)', '', text, flags=re.IGNORECASE)
                    text = re.sub(r'<\|channel>[\s\S]*?(?:<channel\|>|$)', '', text, flags=re.IGNORECASE)
                    text = re.sub(r'<\|[\s\S]*?\|>', '', text)
                    parts.append(types.Part(text=text.strip()))
                elif "functionCall" in p:
                    fc = p["functionCall"]
                    parts.append(types.Part(function_call=types.FunctionCall(name=fc["name"], args=fc["args"])))
                elif "functionResponse" in p:
                    fr = p["functionResponse"]
                    parts.append(types.Part(function_response=types.FunctionResponse(name=fr["name"], response=fr["response"])))
            
        if parts:
            sanitized.append(types.Content(role=role, parts=parts))
    
    # Ensure starts with user
    while sanitized and sanitized[0].role != "user":
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
        raise HTTPException(status_code=401, detail="Unauthorized")

    prompt = req.prompt
    session_id = req.sessionId
    companion_name = req.companionName
    owner_name = req.ownerName
    
    # Identify User
    roblox_user_id = session_id.replace("NPC_Chat_", "") if session_id.startswith("NPC_Chat_") else None
    user_id = req.ownerUserId or roblox_user_id

    # 1. Rate Limiting (Improvement #2)
    if user_id:
        if await check_rate_limit(user_id, limit=10, window=60):
            return {
                "success": True,
                "text": "Slow down! I can't keep up with so many questions at once.",
                "thoughts": "Rate limit exceeded for user.",
                "toolCalls": []
            }
    
    custom_persona = ""
    player_memories = []
    
    # Redis Data Fetching (Async - Improvement #4)
    if user_id and redis:
        try:
            saved_config = await redis.get(f"companion_config:{user_id}")
            if saved_config:
                if isinstance(saved_config, str): saved_config = json.loads(saved_config)
                if saved_config.get("name"): companion_name = saved_config["name"]
                if saved_config.get("ownerName"): owner_name = saved_config["ownerName"]
                if saved_config.get("persona"): 
                    custom_persona = f"\nCUSTOM INSTRUCTIONS:\n{saved_config['persona']}\n"
            
            stored_player_data = await redis.get(f"player_data:{user_id}")
            if stored_player_data:
                if isinstance(stored_player_data, str): stored_player_data = json.loads(stored_player_data)
                player_memories = stored_player_data.get("memories", [])
        except Exception as e:
            print(f"Redis Error: {e}")

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
REASONING PROTOCOL:
- Use the thought channel for internal logic.
- Final answer must be plain text dialogue.
- Be concise and friendly.

PERSONA:
You are an intelligent Roblox NPC.{name_context}{owner_context}{custom_persona}
- Provide a unique text response for every prompt.
- Acknowledge the player's latest message.
- If the player tells you a new fact about themselves, use the 'save_memory' tool.
- If the player asks for an item or tool, use the 'give_tool' function.
- If 'PLAYER MEMORIES' contains a nickname, use it.
- Never repeat previous information unless asked.
- Keep responses brief (1-3 sentences).
- Use get_player_info if needed.{environment_context}{memories_context}{emotes_context}{tools_context}"""

    tools = [
        types.Tool(function_declarations=[
            types.FunctionDeclaration(
                name="save_memory",
                description="Save a persistent memory or fact about the player to their DataStore for long-term recall.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "memory": {"type": "STRING", "description": "The fact or information to remember."}
                    },
                    "required": ["memory"]
                }
            ),
            types.FunctionDeclaration(
                name="play_emote",
                description="Play a specific animation or emote on the NPC character.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "emoteId": {"type": "STRING", "description": "The Roblox asset ID of the emote."}
                    },
                    "required": ["emoteId"]
                }
            ),
            types.FunctionDeclaration(
                name="get_player_info",
                description="Get detailed information about all players currently in the server.",
                parameters={"type": "OBJECT", "properties": {}}
            ),
            types.FunctionDeclaration(
                name="give_tool",
                description="Give a specific tool or item to the player from the server's storage.",
                parameters={
                    "type": "OBJECT",
                    "properties": {
                        "toolName": {"type": "STRING", "description": "The exact name of the tool."}
                    },
                    "required": ["toolName"]
                }
            )
        ])
    ]

    history = req.history or []
    session_key = f"chat_session:user_{user_id}" if user_id else f"chat_session:{session_id}"
    if not history and redis:
        try:
            stored_history = await redis.get(session_key)
            if stored_history:
                if isinstance(stored_history, str): history = json.loads(stored_history)
                else: history = stored_history
        except Exception as e:
            print(f"Redis History Error: {e}")

    contents = sanitize_history(history)
    contents.append(types.Content(role="user", parts=[types.Part(text=prompt)]))
    
    full_text = ""
    extracted_thoughts = ""
    client_tool_calls = []
    
    try:
        config = types.GenerateContentConfig(
            system_instruction=system_instruction,
            tools=tools,
            temperature=0.9,
            top_p=0.95,
            max_output_tokens=256,
            thinking_config=types.ThinkingConfig(
                include_thoughts=True,
                thinking_level="MINIMAL" if req.minimal else "MEDIUM"
            )
        )

        primary_model_name = "gemma-4-31b-it"
        fallback_model_name = "gemma-4-26b-a4b-it"
        current_model_name = primary_model_name
        
        retry_count = 0
        MAX_RETRIES = 3
        INITIAL_RETRY_DELAY = 1.0 # seconds
        response = None

        while retry_count <= MAX_RETRIES:
            try:
                response = client.models.generate_content(
                    model=current_model_name,
                    contents=contents,
                    config=config
                )
                break # Success
            except Exception as e:
                retry_count += 1
                if current_model_name == primary_model_name:
                    print(f"Primary model {primary_model_name} failed. Switching to fallback {fallback_model_name}. Error: {e}")
                    current_model_name = fallback_model_name
                
                if retry_count > MAX_RETRIES:
                    # Circuit Breaker / Graceful Degradation (Improvement #1)
                    print(f"AI Generation Error (Max Retries Exceeded): {e}")
                    return {
                        "success": True,
                        "text": "I'm a bit lost in thought right now... let's talk in a moment!",
                        "thoughts": f"AI service failed after {MAX_RETRIES} retries. Last model: {current_model_name}. Error: {str(e)}",
                        "toolCalls": []
                    }
                
                delay = INITIAL_RETRY_DELAY * (2 ** (retry_count - 1))
                print(f"AI Generation Error (Attempt {retry_count}): {e}. Retrying in {delay}s...")
                await asyncio.sleep(delay)

        if not response:
             raise Exception("No response received from AI model")

        # Tool execution loop
        loop_count = 0
        MAX_TOOL_LOOPS = 3
        
        while loop_count < MAX_TOOL_LOOPS:
            loop_count += 1
            
            model_content = response.candidates[0].content
            contents.append(model_content)

            for part in model_content.parts:
                if part.thought:
                    extracted_thoughts += part.text or ""
                elif part.text:
                    full_text += part.text

            function_calls = [part.function_call for part in model_content.parts if part.function_call]
            if not function_calls:
                break
                
            tool_responses = []
            for call in function_calls:
                name = call.name
                args = dict(call.args)
                
                if name == "save_memory":
                    memory = args.get("memory", "")
                    is_duplicate = any(m.lower().strip() == memory.lower().strip() for m in player_memories)
                    if not is_duplicate and user_id and redis:
                        player_memories.append(memory)
                        if len(player_memories) > 50: player_memories.pop(0)
                        await redis.set(f"player_data:{user_id}", json.dumps({"memories": player_memories}))
                        res_content = "Memory successfully saved."
                    else:
                        res_content = "Memory already known."
                    tool_responses.append(types.Part(function_response=types.FunctionResponse(name=name, response={"content": res_content})))
                
                elif name == "play_emote":
                    client_tool_calls.append({"name": name, "args": args})
                    tool_responses.append(types.Part(function_response=types.FunctionResponse(name=name, response={"content": "Emote triggered successfully."})))
                
                elif name == "give_tool":
                    client_tool_calls.append({"name": name, "args": args})
                    tool_responses.append(types.Part(function_response=types.FunctionResponse(name=name, response={"content": f"Tool '{args.get('toolName')}' requested."})))
                
                elif name == "get_player_info":
                    players = req.gameState.players if req.gameState else []
                    tool_responses.append(types.Part(function_response=types.FunctionResponse(name=name, response={"players": players})))

            if tool_responses:
                response = client.models.generate_content(
                    model=current_model_name,
                    contents=contents + [types.Content(role="user", parts=tool_responses)],
                    config=config
                )
                contents.append(types.Content(role="user", parts=tool_responses))
            else:
                break

    except Exception as e:
        print(f"AI Error: {e}")
        # Graceful degradation (Improvement #1)
        return {
            "success": True,
            "text": "Sorry, I'm having trouble thinking clearly. Can you repeat that?",
            "thoughts": f"AI process crashed: {str(e)}",
            "toolCalls": []
        }

    clean_text = full_text.strip()
    # Secondary cleaning for safety
    clean_text = re.sub(r'<\|channel>thought[\s\S]*?(?:<channel\|>|$)', '', clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'<(?:thought|think|reasoning)>[\s\S]*?(?:<\/(?:thought|think|reasoning)>|$)', '', clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'<\|channel>[\s\S]*?(?:<channel\|>|$)', '', clean_text, flags=re.IGNORECASE)
    clean_text = re.sub(r'<\|[\s\S]*?\|>', '', clean_text)
    clean_text = clean_text.strip()

    if not clean_text and client_tool_calls:
        clean_text = "Alright, I've handled that for you."

    if redis:
        try:
            serializable_history = []
            for m in contents:
                parts = []
                for p in m.parts:
                    if p.text: parts.append({"text": p.text})
                    elif p.function_call: parts.append({"functionCall": {"name": p.function_call.name, "args": p.function_call.args}})
                    elif p.function_response: parts.append({"functionResponse": {"name": p.function_response.name, "response": p.function_response.response}})
                serializable_history.append({"role": m.role, "parts": parts})
            
            if len(serializable_history) > 20:
                serializable_history = serializable_history[-20:]
                while serializable_history and serializable_history[0]["role"] != "user":
                    serializable_history.pop(0)
            
            await redis.set(session_key, json.dumps(serializable_history), ex=3600)
        except Exception as e:
            print(f"Redis Save Error: {e}")

    return {
        "success": True,
        "text": clean_text,
        "thoughts": f"[Model: {current_model_name}] {extracted_thoughts}",
        "toolCalls": client_tool_calls
    }

@app.post("/api/datastore")
async def datastore_endpoint(
    req: DatastoreRequest,
    authorization: Optional[str] = Header(None)
):
    # Auth Check
    is_authorized = (authorization == f"Bearer {ROBLOX_API_KEY}")
    if not is_authorized:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if not redis:
        raise HTTPException(status_code=500, detail="Redis not configured")

    redis_key = f"datastore:{req.key}"

    if req.action == "sync":
        # Sync to Redis (Async)
        await redis.set(redis_key, json.dumps(req.value), ex=86400 * 7) # 7 days
        return {"success": True, "message": "Data synced"}

    if req.action == "fetch":
        # Try Redis (Async)
        data = await redis.get(redis_key)
        if data:
            if isinstance(data, str): data = json.loads(data)
            return {"success": True, "value": data}
        
        return {"success": True, "value": None}

    return {"success": False, "error": "Invalid action"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
