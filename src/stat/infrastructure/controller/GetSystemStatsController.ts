import type { NextFunction, Request, Response } from "express";

import type { GetSystemStats } from "../../application/usecase/GetSystemStats.js";

export class GetSystemStatsController {
  constructor(private readonly getSystemStats: GetSystemStats) {}

  execute = async (
    _request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await this.getSystemStats.execute();

      response.status(200).json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  };
}
