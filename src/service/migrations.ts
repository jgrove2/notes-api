import { directSql } from "./database.js";

export interface Migration {
  version: string;
  name: string;
  up: () => Promise<void>;
  down?: () => Promise<void>;
}

export class MigrationService {
  private static instance: MigrationService;

  private constructor() {}

  public static getInstance(): MigrationService {
    if (!MigrationService.instance) {
      MigrationService.instance = new MigrationService();
    }
    return MigrationService.instance;
  }

  // Create migrations table if it doesn't exist
  private async ensureMigrationsTable(): Promise<void> {
    try {
      await directSql`
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          version VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      console.log("✅ Migrations table ready");
    } catch (error) {
      console.error("❌ Failed to create migrations table:", error);
      throw error;
    }
  }

  // Check if a migration has been executed
  private async isMigrationExecuted(version: string): Promise<boolean> {
    try {
      const result = await directSql`
        SELECT version FROM migrations WHERE version = ${version}
      `;
      return result.length > 0;
    } catch (error) {
      console.error("Error checking migration status:", error);
      return false;
    }
  }

  // Mark migration as executed
  private async markMigrationExecuted(
    version: string,
    name: string
  ): Promise<void> {
    try {
      await directSql`
        INSERT INTO migrations (version, name) 
        VALUES (${version}, ${name})
      `;
    } catch (error) {
      console.error("Error marking migration as executed:", error);
      throw error;
    }
  }

  // Run all pending migrations
  async runMigrations(): Promise<void> {
    console.log("🔄 Running database migrations...");

    try {
      // Ensure migrations table exists
      await this.ensureMigrationsTable();

      // Get all migrations
      const migrations = this.getMigrations();

      let executed = 0;
      for (const migration of migrations) {
        const isExecuted = await this.isMigrationExecuted(migration.version);

        if (!isExecuted) {
          console.log(
            `⏳ Running migration ${migration.version}: ${migration.name}`
          );

          try {
            await migration.up();
            await this.markMigrationExecuted(migration.version, migration.name);
            executed++;
            console.log(
              `✅ Completed migration ${migration.version}: ${migration.name}`
            );
          } catch (error) {
            console.error(
              `❌ Failed migration ${migration.version}: ${migration.name}`,
              error
            );
            throw error;
          }
        }
      }

      if (executed === 0) {
        console.log("✅ All migrations up to date");
      } else {
        console.log(`✅ Successfully executed ${executed} migration(s)`);
      }
    } catch (error) {
      console.error("❌ Migration process failed:", error);
      throw error;
    }
  }

  // Define all migrations
  private getMigrations(): Migration[] {
    return [
      {
        version: "001",
        name: "create_profiles_table",
        up: async () => {
          await directSql`
            CREATE TABLE IF NOT EXISTS profiles (
              userid SERIAL PRIMARY KEY,
              first_name VARCHAR(255) NOT NULL,
              last_name VARCHAR(255) NOT NULL,
              last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              is_active BOOLEAN DEFAULT true,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `;

          // Create index for performance
          await directSql`
            CREATE INDEX IF NOT EXISTS idx_profiles_is_active 
            ON profiles(is_active)
          `;

          // Create trigger to auto-update last_modified_date
          await directSql`
            CREATE OR REPLACE FUNCTION update_last_modified_date()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.last_modified_date = CURRENT_TIMESTAMP;
              NEW.updated_at = CURRENT_TIMESTAMP;
              RETURN NEW;
            END;
            $$ language 'plpgsql'
          `;

          await directSql`
            DROP TRIGGER IF EXISTS trigger_update_profiles_last_modified ON profiles
          `;

          await directSql`
            CREATE TRIGGER trigger_update_profiles_last_modified
              BEFORE UPDATE ON profiles
              FOR EACH ROW
              EXECUTE FUNCTION update_last_modified_date()
          `;
        },
        down: async () => {
          await directSql`DROP TABLE IF EXISTS profiles CASCADE`;
          await directSql`DROP FUNCTION IF EXISTS update_last_modified_date() CASCADE`;
        },
      },
      {
        version: "002",
        name: "create_notes_table",
        up: async () => {
          await directSql`
            CREATE TABLE IF NOT EXISTS notes (
              id SERIAL PRIMARY KEY,
              file_name VARCHAR(255) NOT NULL,
              user_id INTEGER NOT NULL,
              file_id VARCHAR(255) UNIQUE NOT NULL,
              total_size_bytes BIGINT NOT NULL DEFAULT 0,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES profiles(userid) ON DELETE CASCADE
            )
          `;

          // Create indexes for performance
          await directSql`
            CREATE INDEX IF NOT EXISTS idx_notes_user_id 
            ON notes(user_id)
          `;

          await directSql`
            CREATE INDEX IF NOT EXISTS idx_notes_file_id 
            ON notes(file_id)
          `;

          await directSql`
            CREATE INDEX IF NOT EXISTS idx_notes_file_name 
            ON notes(file_name)
          `;

          // Create trigger to auto-update updated_at
          await directSql`
            DROP TRIGGER IF EXISTS trigger_update_notes_updated_at ON notes
          `;

          await directSql`
            CREATE TRIGGER trigger_update_notes_updated_at
              BEFORE UPDATE ON notes
              FOR EACH ROW
              EXECUTE FUNCTION update_last_modified_date()
          `;
        },
        down: async () => {
          await directSql`DROP TABLE IF EXISTS notes CASCADE`;
        },
      },
    ];
  }

  // Get migration status
  async getMigrationStatus(): Promise<any[]> {
    try {
      await this.ensureMigrationsTable();
      const executed = await directSql`
        SELECT version, name, executed_at 
        FROM migrations 
        ORDER BY executed_at ASC
      `;

      const allMigrations = this.getMigrations();

      return allMigrations.map((migration) => {
        const executedMigration = executed.find(
          (m: any) => m.version === migration.version
        );
        return {
          version: migration.version,
          name: migration.name,
          executed: !!executedMigration,
          executed_at: executedMigration?.executed_at || null,
        };
      });
    } catch (error) {
      console.error("Error getting migration status:", error);
      return [];
    }
  }
}

export const migrationService = MigrationService.getInstance();
