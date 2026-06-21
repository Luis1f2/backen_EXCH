import type { NextFunction, Request, Response } from "express";
import type { DeleteUserProfile } from "../../applications/usecase/DeleteUserProfile.js";
import type { AuthenticatedRequest } from "./AuthenticatedRequest.js";

export class DeleteUserProfileController {
  constructor(private readonly deleteUserProfile: DeleteUserProfile) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId } = request as AuthenticatedRequest;

      await this.deleteUserProfile.execute(userId);

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}