export type UserType =
  | "admin_plataforma"
  | "admin_negocio"
  | "turista_nacional"
  | "turista_extranjero"
  | "habitante_local";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  imgUrl: string | null;
  passwordHash: string;
  userTypeId: string;
  userType: UserType;
  registeredAt: Date;
  isPremium: boolean;
  active: boolean;
}

export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
