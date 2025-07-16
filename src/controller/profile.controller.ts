import type { Request } from "express";
import {
  getProfileService,
  createProfileService,
  updateProfileService,
} from "../service/profile.service.js";
import type {
  CreateProfileData,
  Profile,
  UpdateProfileData,
} from "../models/profile.model.js";

export async function getProfileById(userId: number, req: Request) {
  try {
    const profile = await getProfileService(userId, req);
    return profile;
  } catch (error) {
    console.error("Get profile by ID error:", error);
    return new Error("Failed to fetch profile");
  }
}

export async function createProfile(
  profileData: CreateProfileData,
  req: Request
): Promise<Profile | null> {
  const newProfile = await createProfileService(profileData, req);
  return newProfile;
}

export async function updateProfile(
  userId: number,
  updateData: UpdateProfileData,
  req: Request
): Promise<Profile | null> {
  const newProfile = await updateProfileService(userId, updateData, req);
  return newProfile;
}
