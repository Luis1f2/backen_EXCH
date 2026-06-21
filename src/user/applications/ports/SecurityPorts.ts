export interface PasswordHasher {
  hash(password: string): Promise<string>;

  compare(
    password: string,
    passwordHash: string
  ): Promise<boolean>;
}

export interface TokenService {
  sign(userId: string): string;
  verify(token: string): string;
}