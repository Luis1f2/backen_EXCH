import { toPublicUser, type PublicUser } from "../../domain/entities/User.js";
import type {
  UpdateUserData,
  UserRepository
} from "../../domain/repositories/UserRepository.js";
import type { PasswordHasher } from "../ports/SecurityPorts.js";
import { AppError } from "../errors/AppError.js";

export interface UpdateUserProfileInput {
  username?: string;
  password?: string;
  email?: string | null;
  phone?: string | null;
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

    const usernameOwner = input.username
      ? await this.repository.findByUsername(input.username)
      : null;

    if (usernameOwner && usernameOwner.id !== userId) {
      throw new AppError("El nombre de usuario ya existe", 409);
    }

    const changes: UpdateUserData = {};

    if (input.username !== undefined) changes.username = input.username;
    if (input.email !== undefined) changes.email = input.email;
    if (input.phone !== undefined) changes.phone = input.phone;

    if (input.password !== undefined) {
      changes.passwordHash =
        await this.passwordHasher.hash(input.password);
    }

    const updatedUser = await this.repository.update(userId, changes);

    if (!updatedUser) {
      throw new AppError("No se pudo actualizar el usuario", 404);
    }

    return toPublicUser(updatedUser);
  }
}