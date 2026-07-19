import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { UpdateUserProfile } from "../../application/usecase/UpdateUserProfile.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const updateSchema = z.object({
  name: z.string().trim().min(3).max(100).optional(),
  email: z.string().trim().email().max(150).optional(),
  phone: z.string().trim().max(20).nullable().optional(),
  password: z.string().min(8).max(72).optional(),
  imgUrl: z.string().url().nullable().optional(),
});

export class UpdateUserProfileController {
  constructor(private readonly updateUserProfile: UpdateUserProfile) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest = request as AuthenticatedRequest;
      const input = updateSchema.parse(request.body);

      const user = await this.updateUserProfile.execute(
        authenticatedRequest.userId,
        input
      );

      response.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };
}