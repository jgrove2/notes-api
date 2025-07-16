import { z } from "zod";
import type { DatabaseRow } from "../service/database.js";

// Zod schemas for validation
export const CreateNoteSchema = z.object({
  file_name: z.string().min(1).max(255),
  user_id: z.number().int().positive(),
  file_id: z.string().min(1).max(255),
  total_size_bytes: z.number().int().nonnegative().default(0),
});

export const UpdateNoteSchema = z.object({
  file_name: z.string().min(1).max(255).optional(),
  total_size_bytes: z.number().int().nonnegative().optional(),
});

export const NoteParamsSchema = z.object({
  id: z.string().transform((val) => parseInt(val, 10)),
});

// TypeScript interfaces
export interface Note extends DatabaseRow {
  id: number;
  file_name: string;
  user_id: number;
  file_id: string;
  total_size_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteInput {
  file_name: string;
  user_id: number;
  file_id: string;
  total_size_bytes?: number;
}

export interface UpdateNoteInput {
  file_name?: string;
  total_size_bytes?: number;
}

// Type inference from Zod schemas
export type CreateNoteData = z.infer<typeof CreateNoteSchema>;
export type UpdateNoteData = z.infer<typeof UpdateNoteSchema>;
export type NoteParams = z.infer<typeof NoteParamsSchema>;
