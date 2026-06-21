import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import type { UpdateUserProfile } from "../../applications/usecase/UpdateUserProfile.js";
import type { AuthenticatedRequest } from "./AuthenticatedRequest.js";

const optionalText = (maximum: number) =>
  z.preprocess(
    (value) => value === "" ? null : value,
    z.string().trim().max(maximum).nullable().optional()
  );

const updateSchema = z.object({
  username: z.string().trim().min(3).max(50).optional(),
  password: z.string().min(8).max(72).optional(),
  email: z.preprocess(
    (value) => value === "" ? null : value,
    z.string().trim().email().max(254).nullable().optional()
  ),
  phone: optionalText(20)
}).refine(
  (input) => Object.keys(input).length > 0,
  { message: "Debes enviar al menos un campo" }
);

export class UpdateUserProfileController {
  constructor(private readonly updateUserProfile: UpdateUserProfile) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId } = request as AuthenticatedRequest;
      const input = updateSchema.parse(request.body);

      const user = await this.updateUserProfile.execute(userId, input);

      response.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };
}