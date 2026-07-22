import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { UpdateUserProfile } from "../../application/usecase/UpdateUserProfile.js";
import type { AuthenticatedRequest } from "../../../http/middlewares/AuthenticatedRequest.js";

const phoneSchema = z
  .string()
  .trim()
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

const updateSchema = z.object({
  name: z.string().trim().min(3).max(100).optional(),
  email: z.string().trim().toLowerCase().email().max(150).optional(),
  phone:phoneSchema.nullable().optional(),
  password: z.string().min(8).max(72).optional(),
  imgUrl: z.string().url().nullable().optional(),
});

export class UpdateUserProfileController {
  constructor(private readonly updateUserProfile: UpdateUserProfile) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authenticatedRequest = request as AuthenticatedRequest;
      const input = updateSchema.parse(request.body);

      const user = await this.updateUserProfile.execute(
        authenticatedRequest.userId,
        input
      );

      response.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };
}