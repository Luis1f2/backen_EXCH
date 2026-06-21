export interface User {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}