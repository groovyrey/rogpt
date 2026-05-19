import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { universeId, datastoreName, entryKey, action, value, topic, message } = await request.json();
    const apiKey = process.env.ROBLOX_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "ROBLOX_API_KEY not configured" }, { status: 500 });
    }

    if (!universeId) {
      return NextResponse.json({ error: "Universe ID is required" }, { status: 400 });
    }

    const baseUrl = `https://apis.roblox.com/datastores/v1/universes/${universeId}/standard-datastores`;

    if (action === 'list_datastores') {
      const res = await fetch(`${baseUrl}?limit=50`, {
        headers: { 'x-api-key': apiKey }
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'list_keys') {
      if (!datastoreName) return NextResponse.json({ error: "DataStore name required" }, { status: 400 });
      const scope = request.headers.get("x-roblox-scope") || "global";
      const res = await fetch(`${baseUrl}/datastore/entries?datastoreName=${encodeURIComponent(datastoreName)}&scope=${encodeURIComponent(scope)}&limit=50`, {
        headers: { 'x-api-key': apiKey }
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'get_entry') {
      if (!datastoreName || !entryKey) return NextResponse.json({ error: "DataStore name and Key required" }, { status: 400 });
      const scope = request.headers.get("x-roblox-scope") || "global";
      const res = await fetch(`${baseUrl}/datastore/entries/entry?datastoreName=${encodeURIComponent(datastoreName)}&entryKey=${encodeURIComponent(entryKey)}&scope=${encodeURIComponent(scope)}`, {
        headers: { 'x-api-key': apiKey }
      });
      
      if (res.status === 404) return NextResponse.json({ value: null });
      
      const metadata = {
        version: res.headers.get('roblox-entry-version'),
        createdTime: res.headers.get('roblox-entry-created-time'),
        attributes: res.headers.get('roblox-entry-attributes'),
        userIds: res.headers.get('roblox-entry-userids'),
      };

      const data = await res.json();
      return NextResponse.json({ value: data, metadata });
    }

    if (action === 'set_entry') {
      if (!datastoreName || !entryKey) return NextResponse.json({ error: "DataStore name and Key required" }, { status: 400 });
      const scope = request.headers.get("x-roblox-scope") || "global";
      
      const res = await fetch(`${baseUrl}/datastore/entries/entry?datastoreName=${encodeURIComponent(datastoreName)}&entryKey=${encodeURIComponent(entryKey)}&scope=${encodeURIComponent(scope)}`, {
        method: 'POST',
        headers: { 
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(value)
      });
      
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (action === 'publish_message') {
      if (!topic || !message) return NextResponse.json({ error: "Topic and Message required" }, { status: 400 });

      const msgRes = await fetch(`https://apis.roblox.com/messaging-service/v1/universes/${universeId}/topics/${encodeURIComponent(topic)}`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      if (msgRes.status === 200) {
        return NextResponse.json({ success: true });
      } else {
        const errData = await msgRes.json();
        return NextResponse.json({ success: false, error: errData }, { status: msgRes.status });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Open Cloud Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
