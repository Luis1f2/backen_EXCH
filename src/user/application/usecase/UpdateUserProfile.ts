import {
  toPublicUser,
  type PublicUser
} from "../../domain/entities/User.js";

import type {
  UpdateUserData,
  UserRepository
} from "../../domain/repositories/UserRepository.js";

import type { PasswordHasher } from "../ports/SecurityPorts.js";
import { AppError } from "../errors/AppError.js";

export interface UpdateUserProfileInput {
  name?: string;
  email?: string;
  phone?: string | null;
  password?: string;
}

export class UpdateUserProfile {
  constructor(
    private readonly repository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(
    userId: string,
    input: UpdateUserProfileInput
  ): Promise<PublicUser> {
    const currentUser = await this.repository.findById(userId);

    if (!currentUser) {
      throw new AppError("Usuario no encontrado", 404);
    }

    if (input.email && input.email !== currentUser.email) {
      const existingEmail = await this.repository.findByEmail(input.email);

      if (existingEmail && existingEmail.id !== userId) {
        throw new AppError("El correo ya está registrado", 409);
      }
    }

    const updateData: UpdateUserData = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.email !== undefined) {
      updateData.email = input.email;
    }

    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }

    if (input.password !== undefined) {
      updateData.passwordHash =
        await this.passwordHasher.hash(input.password);
    }

    const updatedUser = await this.repository.update(userId, updateData);

    if (!updatedUser) {
      throw new AppError("No se pudo actualizar el usuario", 500);
    }

    return toPublicUser(updatedUser);
  }
}