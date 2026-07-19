import type {
  NextFunction,
  Request,
  Response
} from "express";

import type {
  DeleteUserProfileImage
} from "../../application/usecase/DeleteUserProfileImage.js";

import type {
  AuthenticatedRequest
} from "../../../http/middlewares/AuthenticatedRequest.js";

export class DeleteUserProfileImageController {
  constructor(
    private readonly deleteUserProfileImage:
      DeleteUserProfileImage
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      /*
       * No recibimos usuarioId por URL.
       * Se obtiene directamente del JWT.
       */
      const userId = (
        request as AuthenticatedRequest
      ).userId;

      await this.deleteUserProfileImage.execute(
        userId
      );

      response.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}