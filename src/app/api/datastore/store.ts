// Global singleton store for synced player data during local development
// In a production environment, this would be a real database like Redis or Turso.

if (!(global as any).cachedDataStore) {
  (global as any).cachedDataStore = {};
}

export const cachedDataStore: Record<string, any> = (global as any).cachedDataStore;
