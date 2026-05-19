
export class RobloxOpenCloud {
  private universeId: string;
  private apiKey: string;
  private baseUrl: string;

  constructor(universeId: string, apiKey: string) {
    this.universeId = universeId;
    this.apiKey = apiKey;
    this.baseUrl = `https://apis.roblox.com/datastores/v1/universes/${universeId}/standard-datastores`;
  }

  /**
   * Fetches an entry from a standard DataStore.
   */
  async getEntry(datastoreName: string, key: string, scope: string = "global") {
    const url = `${this.baseUrl}/datastore/entries/entry?datastoreName=${datastoreName}&entryKey=${key}&scope=${scope}`;
    
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "x-api-key": this.apiKey,
        },
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        const errorBody = await response.text();
        throw new Error(`Roblox API Error (${response.status}): ${errorBody}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching from Roblox Open Cloud:", error);
      throw error;
    }
  }

  /**
   * Sets an entry in a standard DataStore.
   */
  async setEntry(datastoreName: string, key: string, value: any, scope: string = "global") {
    const url = `${this.baseUrl}/datastore/entries/entry?datastoreName=${datastoreName}&entryKey=${key}&scope=${scope}`;
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(value),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Roblox API Error (${response.status}): ${errorBody}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error setting entry in Roblox Open Cloud:", error);
      throw error;
    }
  }
}

export const robloxCloud = new RobloxOpenCloud(
  process.env.ROGPT_UNIVERSE_ID || "",
  process.env.ROBLOX_API_KEY || ""
);
