import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import type { ListUsers } from "../../application/usecase/ListUsers.js";

const querySchema = z.object({
  limit:  z.coerce.number().int().positive().max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0)
});

export class ListUsersController {
  constructor(private readonly listUsers: ListUsers) {}

  execute = async (
    request: Request,
    response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { limit, offset } = querySchema.parse(request.query);
      const users = await this.listUsers.execute(limit, offset);

      response.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  };
}
