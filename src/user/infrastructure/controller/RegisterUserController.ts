import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { RegisterUser } from "../../applications/usecase/RegisterUser.js";

const registerSchema = z.object({
  name: z.string().trim().min(3).max(100),
  email: z.string().trim().email().max(150),
  password: z.string().min(8).max(72),
  phone: z.string().trim().max(20).nullable().optional(),
  userType: z.enum([
    "turista_nacional",
    "turista_extranjero",
    "habitante_local"
  ])
});

export class RegisterUserController {
  constructor(private readonly registerUser: RegisterUser) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input = registerSchema.parse(request.body);
      const user = await this.registerUser.execute(input);

      response.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };
}