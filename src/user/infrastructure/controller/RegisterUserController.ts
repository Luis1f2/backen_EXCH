import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { RegisterUser } from "../../application/usecase/RegisterUser.js";

const phoneSchema = z.string().trim()
  .max(
    20,
    "El teléfono no puede superar los 20 caracteres",
  )
  .refine(
    (value) =>
      /^\+?[0-9\s()-]+$/.test(value),
    {
      message:
        "El teléfono contiene caracteres no permitidos",
    },
  )
  .refine(
    (value) => {
      const digitCount =
        value.replace(/\D/g, "").length;

      return (
        digitCount >= 10 &&
        digitCount <= 15
      );
    },
    {
      message:
        "El teléfono debe contener entre 10 y 15 dígitos",
    },
  );

const registerSchema = z.object({
  name: z.string().trim().min(3).max(100),
  email: z.string().trim().toLowerCase().email().max(150),
  password: z.string().min(8).max(72),
 phone:phoneSchema.nullable().optional(),
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