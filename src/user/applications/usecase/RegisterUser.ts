import { randomUUID } from "node:crypto";
import { toPublicUser, type PublicUser } from "../../domain/entities/User.js";
import type { UserRepository } from "../../domain/repositories/UserRepository.js";
import type { PasswordHasher } from "../ports/SecurityPorts.js";
import { AppError } from "../errors/AppError.js";

export interface RegisterUserInput {
  username: string;
  password: string;
  email?: string | null;
  phone?: string | null;
}

export class RegisterUser {
  constructor(
    private readonly repository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(input: RegisterUserInput): Promise<PublicUser> {
    if (await this.repository.findByUsername(input.username)) {
      throw new AppError("El nombre de usuario ya existe", 409);
    }

    if (input.email && await this.repository.findByEmail(input.email)) {
      throw new AppError("El correo ya está registrado", 409);
    }

    if (input.phone && await this.repository.findByPhone(input.phone)) {
      throw new AppError("El teléfono ya está registrado", 409);
    }

    const user = await this.repository.create({
      id: randomUUID(),
      username: input.username,
      email: input.email ?? null,
      phone: input.phone ?? null,
      passwordHash: await this.passwordHasher.hash(input.password)
    });

    return toPublicUser(user);
  }
}