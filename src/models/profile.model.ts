import { z } from "zod";
import type { DatabaseRow } from "../service/database.js";

// Zod schemas for validation
export const CreateProfileSchema = z.object({
  first_name: z.string().min(1).max(255),
  last_name: z.string().min(1).max(255),
  is_active: z.boolean().optional().default(true),
});

export const UpdateProfileSchema = z.object({
  first_name: z.string().min(1).max(255).optional(),
  last_name: z.string().min(1).max(255).optional(),
  is_active: z.boolean().optional(),
});

export const ProfileParamsSchema = z.object({
  userid: z.string().transform((val) => parseInt(val, 10)),
});

// TypeScript interfaces
export interface Profile extends DatabaseRow {
  userid: number;
  first_name: string;
  last_name: string;
  last_modified_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileInput {
  first_name: string;
  last_name: string;
  is_active?: boolean;
}

export interface UpdateProfileInput {
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

// Type inference from Zod schemas
export type CreateProfileData = z.infer<typeof CreateProfileSchema>;
export type UpdateProfileData = z.infer<typeof UpdateProfileSchema>;
export type ProfileParams = z.infer<typeof ProfileParamsSchema>;
