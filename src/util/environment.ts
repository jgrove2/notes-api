import dotenv from "dotenv";

dotenv.config();

export const DATABASE_URL: string | undefined =
  process.env.DATABASE_URL || undefined;

export const PORT: number = parseInt(process.env.PORT || "3001", 10);

export const KINDE_ISSUER: string = process.env.KINDE_ISSUER || "";
