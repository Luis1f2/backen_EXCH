import type {
  NextFunction,
  Request,
  Response
} from "express";

import type {
  GetUserInterests
} from "../../application/usecase/GetUserInterests.js";

import type {
  AuthenticatedRequest
} from "../../../http/middlewares/AuthenticatedRequest.js";

export class GetUserInterestsController {
  constructor(
    private readonly getUserInterests:
      GetUserInterests
  ) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (
        request as AuthenticatedRequest
      ).userId;

      const result =
        await this.getUserInterests.execute(
          userId
        );

      response.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}