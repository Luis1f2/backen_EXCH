import type { NextFunction, Request, Response } from "express";
import type { GetUserProfile } from "../../application/usecase/GetUserProfile.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

export class GetUserProfileController {
  constructor(private readonly getUserProfile: GetUserProfile) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId } = request as AuthenticatedRequest;
      const user = await this.getUserProfile.execute(userId);

      response.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };
}