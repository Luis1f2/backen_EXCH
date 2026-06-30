import type { NextFunction, Request, Response } from "express";

import type { ListMyRoutes } from "../../application/usecase/ListMyRoutes.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

export class ListMyRoutesController {
  constructor(private readonly listMyRoutes: ListMyRoutes) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest = request as AuthenticatedRequest;

      const routes = await this.listMyRoutes.execute(
        authenticatedRequest.userId
      );

      response.status(200).json({
        success: true,
        data: routes
      });
    } catch (error) {
      next(error);
    }
  };
}