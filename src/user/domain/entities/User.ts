export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  userTypeId: string;
  registeredAt: Date;
  isPremium: boolean;
  active: boolean;
}

export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;

  return publicUser;
}