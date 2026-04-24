import Dexie, { type Table } from "dexie";

const TOKEN_KEY = "auth_token";

class AppDb extends Dexie {
  kv!: Table<{ key: string; value: string }, string>;

  constructor() {
    super("lingxi_app_db");
    this.version(1).stores({
      kv: "key",
    });
  }
}

const db = new AppDb();

export const tokenStorage = {
  async getToken(): Promise<string> {
    const item = await db.kv.get(TOKEN_KEY);
    return item?.value ?? "";
  },
  async setToken(token: string): Promise<void> {
    await db.kv.put({ key: TOKEN_KEY, value: token });
  },
  async clearToken(): Promise<void> {
    await db.kv.delete(TOKEN_KEY);
  },
};
