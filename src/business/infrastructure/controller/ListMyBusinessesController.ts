import type { NextFunction, Request, Response } from "express";

import type { ListMyBusinesses } from "../../application/usecase/ListMyBusinesses.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

export class ListMyBusinessesController {
  constructor(private readonly listMyBusinesses: ListMyBusinesses) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest = request as AuthenticatedRequest;

      const businesses = await this.listMyBusinesses.execute(
        authenticatedRequest.userId
      );

      response.status(200).json({
        success: true,
        data: businesses
      });
    } catch (error) {
      next(error);
    }
  };
}