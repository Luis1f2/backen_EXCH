import {
  toPublicUser,
  type PublicUser
} from "../../domain/entities/User.js";

import type { UserRepository } from "../../domain/repositories/UserRepository.js";
import { AppError } from "../errors/AppError.js";

export class GetUserProfile {
  constructor(private readonly repository: UserRepository) {}

  async execute(userId: string): Promise<PublicUser> {
    const user = await this.repository.findById(userId);

    if (!user) {
      throw new AppError("Usuario no encontrado", 404);
    }

    return toPublicUser(user);
  }
}