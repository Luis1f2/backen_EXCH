import { randomUUID } from "node:crypto";
import { OAuth2Client } from "google-auth-library";

import {
  toPublicUser,
  type PublicUser
} from "../../domain/entities/User.js";

import type { UserRepository } from "../../domain/repositories/UserRepository.js";
import type { PasswordHasher, TokenService } from "../ports/SecurityPorts.js";
import { AppError } from "../errors/AppError.js";

export interface GoogleAuthResult {
  user: PublicUser;
  token: string;
}

export class GoogleAuthUser {
  private readonly client: OAuth2Client;

  constructor(
    private readonly repository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly googleClientId: string
  ) {
    this.client = new OAuth2Client(googleClientId);
  }

  async execute(idToken: string): Promise<GoogleAuthResult> {
    const ticket = await this.client
      .verifyIdToken({ idToken, audience: this.googleClientId })
      .catch(() => {
        throw new AppError("Token de Google inválido", 401);
      });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new AppError("Token de Google sin correo", 400);
    }

    const { email, name } = payload;

    let user = await this.repository.findByEmail(email);

    if (!user) {
      const userTypeId =
        await this.repository.findUserTypeIdByName("turista_nacional");

      if (!userTypeId) {
        throw new AppError("Tipo de usuario no encontrado", 500);
      }

      const fakePasswordHash = await this.passwordHasher.hash(randomUUID());

      user = await this.repository.create({
        id: randomUUID(),
        name: name ?? email.split("@")[0],
        email,
        phone: null,
        passwordHash: fakePasswordHash,
        userTypeId
      });
    }

    const token = this.tokenService.sign(user.id);

    return { user: toPublicUser(user), token };
  }
}
