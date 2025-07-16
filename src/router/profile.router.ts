import { Router } from "express";
import type { Request, Response } from "express";
import { validateBody, validateParams } from "../middleware/validation.js";
import {
  createProfile,
  getProfileById,
  updateProfile,
} from "../controller/profile.controller.js";
import {
  CreateProfileSchema,
  ProfileParamsSchema,
  UpdateProfileSchema,
  type CreateProfileData,
} from "../models/profile.model.js";
import { authenticationMiddleware } from "../middleware/authentication.js";

export function createProfileRouter(): Router {
  const router = Router();

  // GET /profiles/:userid
  router
    .get(
      "/:userid",
      authenticationMiddleware,
      validateParams(ProfileParamsSchema),
      async (req: Request, res: Response) => {
        try {
          const userid = parseInt(req.params.userid);
          const profile = await getProfileById(userid, req);
          if (!profile) {
            return res.status(404).json({
              error: "Profile not found",
              message: `Profile with ID ${userid} does not exist`,
            });
          }
          res.json(profile);
        } catch (error) {
          console.error("Get profile by ID error:", error);
          res.status(500).json({
            error: "Failed to fetch profile",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    )
    .put(
      "/:userid",
      validateParams(ProfileParamsSchema),
      validateBody(UpdateProfileSchema),
      async (req: Request, res: Response) => {
        try {
          const userId = parseInt(req.params.userid);
          const updateData = req.body;
          const updatedProfile = await updateProfile(userId, updateData, req);
          if (!updatedProfile) {
            return res.status(404).json({
              error: "Profile not found",
              message: `Profile with ID ${userId} does not exist`,
            });
          }
          res.json({
            data: updatedProfile,
            message: "Profile updated successfully",
          });
        } catch (error) {
          console.error("Update profile error:", error);
          res.status(500).json({
            error: "Failed to update profile",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    );

  // POST /profiles
  router.post(
    "/",
    validateBody(CreateProfileSchema),
    async (req: Request, res: Response) => {
      try {
        const profileData: CreateProfileData = req.body;
        const newProfile = await createProfile(profileData, req);
        res.status(201).json({
          data: newProfile,
          message: "Profile created successfully",
        });
      } catch (error) {
        console.error("Create profile error:", error);
        res.status(500).json({
          error: "Failed to create profile",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  return router;
}
