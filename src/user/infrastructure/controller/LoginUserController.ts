import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { LoginUser } from "../../applications/usecase/LoginUser.js";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1)
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
        input.username,
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