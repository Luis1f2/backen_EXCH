import type { UserRepository } from "../../domain/repositories/UserRepository.js";
import { AppError } from "../errors/AppError.js";

export class DeleteUserProfile {
  constructor(private readonly repository: UserRepository) {}

  async execute(userId: string): Promise<void> {
    const deleted = await this.repository.delete(userId);

    if (!deleted) {
      throw new AppError("Usuario no encontrado", 404);
    }
  }
}