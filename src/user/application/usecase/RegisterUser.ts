import { randomUUID } from "node:crypto";

import {
  toPublicUser,
  type PublicUser
} from "../../domain/entities/User.js";

import type { UserRepository } from "../../domain/repositories/UserRepository.js";
import type { PasswordHasher } from "../ports/SecurityPorts.js";
import { AppError } from "../errors/AppError.js";

const allowedPublicUserTypes = [
  "turista_nacional",
  "turista_extranjero",
  "habitante_local"
] as const;

export type PublicUserType =
  (typeof allowedPublicUserTypes)[number];

export interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  phone?: string | null;
  userType: PublicUserType;
}

export class RegisterUser {
  constructor(
    private readonly repository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(input: RegisterUserInput): Promise<PublicUser> {
    if (!allowedPublicUserTypes.includes(input.userType)) {
      throw new AppError("Tipo de usuario no permitido", 400);
    }

    const existingEmail = await this.repository.findByEmail(input.email);

    if (existingEmail) {
      throw new AppError("El correo ya está registrado", 409);
    }

    const userTypeId =
      await this.repository.findUserTypeIdByName(input.userType);

    if (!userTypeId) {
      throw new AppError("Tipo de usuario no encontrado", 400);
    }

    const user = await this.repository.create({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      passwordHash: await this.passwordHasher.hash(input.password),
      userTypeId
    });

    return toPublicUser(user);
  }
}