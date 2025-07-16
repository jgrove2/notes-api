import pg from "pg";
import { DATABASE_URL } from "../util/environment.js";

const { Pool } = pg;

export interface DatabaseRow {
  [key: string]: any;
}

export class Database {
  private static instance: Database;
  private pool: pg.Pool;

  private constructor() {
    this.pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: DATABASE_URL?.includes("neon.tech")
        ? { rejectUnauthorized: false }
        : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // Health check method to test database connection
  async healthCheck(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query("SELECT 1 as test");
      client.release();
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }

  // Generic query method
  async query<T extends DatabaseRow>(
    text: string,
    params: any[] = []
  ): Promise<T[]> {
    try {
      const client = await this.pool.connect();
      const result = await client.query(text, params);
      client.release();
      return result.rows as T[];
    } catch (error) {
      console.error("Database query error:", error);
      throw new Error("Database query failed");
    }
  }

  // Template literal query method (similar to Neon's syntax)
  async sql<T extends DatabaseRow>(
    strings: TemplateStringsArray,
    ...values: any[]
  ): Promise<T[]> {
    try {
      // Convert template literal to parameterized query
      let text = strings[0];
      const params: any[] = [];

      for (let i = 0; i < values.length; i++) {
        text += `$${i + 1}` + strings[i + 1];
        params.push(values[i]);
      }

      const client = await this.pool.connect();
      const result = await client.query(text, params);
      client.release();
      return result.rows as T[];
    } catch (error) {
      console.error("Database query error:", error);
      throw new Error("Database query failed");
    }
  }

  async insert<T extends DatabaseRow>(
    table: string,
    data: Partial<T>
  ): Promise<T | null> {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);

      // Build the query dynamically
      const columns = keys.join(", ");
      const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");

      const text = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const result = await this.query<T>(text, values);
      return result[0] || null;
    } catch (error) {
      console.error("Insert error:", error);
      return null;
    }
  }

  // Update a record
  async update<T extends DatabaseRow>(
    table: string,
    where: Partial<T>,
    data: Partial<T>,
    returnUpdatedData = true
  ): Promise<T | null> {
    try {
      const keys = Object.keys(data);
      const values = Object.values(data);

      const setClause = keys
        .map((key, index) => `${key} = $${index + 1}`)
        .join(", ");

      const whereKeys = Object.keys(where);
      const whereValues = Object.values(where);
      const whereClause = whereKeys
        .map((keys, index) => `${keys} = $${index + keys.length - 1}`)
        .join(" AND ");
      const text = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} ${
        returnUpdatedData ? "RETURNING *" : ""
      }`;

      const result = await this.query<T>(text, [...values, ...whereValues]);
      return result[0] || null;
    } catch (error) {
      console.error("Update error:", error);
      return null;
    }
  }

  // Delete a record
  async delete(table: string, id: string | number): Promise<boolean> {
    try {
      const text = `DELETE FROM ${table} WHERE id = $1`;
      const result = await this.query(text, [id]);
      return result.length > 0;
    } catch (error) {
      console.error("Delete error:", error);
      return false;
    }
  }

  // Get the pool instance for direct use
  get poolInstance() {
    return this.pool;
  }

  // Close all connections (useful for cleanup)
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export const db = Database.getInstance();

// Export a direct sql function that mimics the Neon template literal syntax
export async function directSql<T extends DatabaseRow>(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<T[]> {
  return await db.sql<T>(strings, ...values);
}
