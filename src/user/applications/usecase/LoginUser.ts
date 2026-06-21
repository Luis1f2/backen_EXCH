import { toPublicUser, type PublicUser } from "../../domain/entities/User.js";
import type { UserRepository } from "../../domain/repositories/UserRepository.js";
import type {
  PasswordHasher,
  TokenService
} from "../ports/SecurityPorts.js";
import { AppError } from "../errors/AppError.js";

export interface LoginResult {
  token: string;
  user: PublicUser;
}

export class LoginUser {
  constructor(
    private readonly repository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService
  ) {}

  async execute(username: string, password: string): Promise<LoginResult> {
    const user = await this.repository.findByUsername(username);

    if (!user || !user.active) {
      throw new AppError("Credenciales incorrectas", 401);
    }

    const validPassword = await this.passwordHasher.compare(
      password,
      user.passwordHash
    );

    if (!validPassword) {
      throw new AppError("Credenciales incorrectas", 401);
    }

    return {
      token: this.tokenService.sign(user.id),
      user: toPublicUser(user)
    };
  }
}