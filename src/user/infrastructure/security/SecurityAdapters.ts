import bcrypt from "bcryptjs";
import jwt, { type JwtPayload } from "jsonwebtoken";

import type {
  PasswordHasher,
  TokenService
} from "../../application/ports/SecurityPorts.js";

import { AppError } from "../../application/errors/AppError.js";

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  async compare(
    password: string,
    passwordHash: string
  ): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}

export class JwtTokenService implements TokenService {
  constructor(private readonly secret: string) {
    if (secret.length < 32) {
      throw new Error(
        "JWT_SECRET debe contener al menos 32 caracteres"
      );
    }
  }

  sign(userId: string): string {
    return jwt.sign({}, this.secret, {
      algorithm: "HS256",
      subject: userId,
      expiresIn: "7d"
    });
  }

  verify(token: string): string {
    try {
      const payload = jwt.verify(token, this.secret, {
        algorithms: ["HS256"]
      }) as JwtPayload;

      if (!payload.sub) {
        throw new Error("Token sin identificador");
      }

      return payload.sub;
    } catch {
      throw new AppError("Token inválido o expirado", 401);
    }
  }
}