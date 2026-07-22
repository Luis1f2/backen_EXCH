import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { LoginUser } from "../../application/usecase/LoginUser.js";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(150),
  password: z.string().min(8).max(72)
});

export class LoginUserController {
  constructor(private readonly loginUser: LoginUser) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input = loginSchema.parse(request.body);

      const result = await this.loginUser.execute(
        input.email,
        input.password
      );

      response.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}