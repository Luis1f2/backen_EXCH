import type { User } from "../entities/User.js";

export interface CreateUserData {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  passwordHash: string;
}

export interface UpdateUserData {
  username?: string;
  email?: string | null;
  phone?: string | null;
  passwordHash?: string;
}

export interface UserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;

  update(
    id: string,
    data: UpdateUserData
  ): Promise<User | null>;

  delete(id: string): Promise<boolean>;
}