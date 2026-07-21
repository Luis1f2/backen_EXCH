import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { GoogleAuthUser } from "../../application/usecase/GoogleAuthUser.js";

const googleAuthSchema = z.object({
  idToken: z.string().min(1)
});

export class GoogleAuthController {
  constructor(private readonly googleAuthUser: GoogleAuthUser) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { idToken } = googleAuthSchema.parse(request.body);

      const result = await this.googleAuthUser.execute(idToken);

      response.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}
