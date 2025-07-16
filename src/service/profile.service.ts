import { db, directSql } from "./database.js";
import type {
  Profile,
  CreateProfileInput,
  UpdateProfileInput,
} from "../models/profile.model.js";
import type { Request } from "express";

export async function getProfileService(
  userId: number,
  req: Request
): Promise<Profile | null> {
  const profiles = await db.query<Profile>(
    `SELECT userid, first_name, last_name, last_modified_date, is_active, created_at, updated_at
       FROM profiles
       WHERE userid = $1`,
    [userId]
  );
  return (profiles[0] as Profile) || null;
}

export async function createProfileService(
  profileData: CreateProfileInput,
  req: Request
): Promise<Profile | null> {
  const { first_name, last_name, is_active = true } = profileData;
  const result = await db.insert<Profile>("profiles", {
    first_name: first_name,
    last_name: last_name,
    is_active: is_active,
  });
  if (!result) {
    return null;
  }
  return (result[0] as Profile) || null;
}

export async function updateProfileService(
  userid: number,
  updateData: UpdateProfileInput,
  req: Request
): Promise<Profile | null> {
  const existingProfile = await getProfileService(userid, req);
  if (!existingProfile) {
    return null;
  }

  const { first_name, last_name, is_active } = updateData;

  // Build dynamic update query using template literals
  const updates: { [key: string]: string | number | boolean } = {};

  if (first_name !== undefined) {
    updates["first_name"] = first_name;
  }

  if (last_name !== undefined) {
    updates["last_name"] = last_name;
  }

  if (is_active !== undefined) {
    updates["is_active"] = is_active;
  }

  updates["last_modified_date"] = new Date().toISOString();

  const result = await db.update<Profile>(
    "profiles",
    { userid: userid },
    updates
  );
  if (!result) {
    return null;
  }
  return (result as Profile) || null;
}
