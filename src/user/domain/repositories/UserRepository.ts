import type { User } from "../entities/User.js";

export interface CreateUserData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  userTypeId: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string | null;
  passwordHash?: string;
}

export interface UserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findUserTypeIdByName(name: string): Promise<string | null>;

  update(
    id: string,
    data: UpdateUserData
  ): Promise<User | null>;

  delete(id: string): Promise<boolean>;
}