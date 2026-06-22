import type { Pool } from "mysql2/promise";
import type { Router } from "express";

import { RegisterUser } from "../applications/usecase/RegisterUser.js";
import { LoginUser } from "../applications/usecase/LoginUser.js";
import { GetUserProfile } from "../applications/usecase/GetUserProfile.js";
import { UpdateUserProfile } from "../applications/usecase/UpdateUserProfile.js";
import { DeleteUserProfile } from "../applications/usecase/DeleteUserProfile.js";

import { MySqlUserRepository } from "./Mysql/MySqlUserRepository.js";

import {
  BcryptPasswordHasher,
  JwtTokenService
} from "./security/SecurityAdapters.js";

import { RegisterUserController } from "./controller/RegisterUserController.js";
import { LoginUserController } from "./controller/LoginUserController.js";
import { GetUserProfileController } from "./controller/GetUserProfileController.js";
import { UpdateUserProfileController } from "./controller/UpdateUserProfileController.js";
import { DeleteUserProfileController } from "./controller/DeleteUserProfileController.js";

import { createUserRoutes } from "./routes/UserRoutes.js";

export function createUserModule(
  databasePool: Pool,
  jwtSecret: string
): Router {
  // Adaptadores de salida
  const userRepository = new MySqlUserRepository(databasePool);
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService(jwtSecret);

  // Casos de uso
  const registerUser = new RegisterUser(
    userRepository,
    passwordHasher
  );

  const loginUser = new LoginUser(
    userRepository,
    passwordHasher,
    tokenService
  );

  const getUserProfile = new GetUserProfile(userRepository);

  const updateUserProfile = new UpdateUserProfile(
    userRepository,
    passwordHasher
  );

  const deleteUserProfile = new DeleteUserProfile(
    userRepository
  );

  // Adaptadores de entrada
  const controllers = {
    register: new RegisterUserController(registerUser),
    login: new LoginUserController(loginUser),
    getProfile: new GetUserProfileController(getUserProfile),
    updateProfile: new UpdateUserProfileController(
      updateUserProfile
    ),
    deleteProfile: new DeleteUserProfileController(
      deleteUserProfile
    )
  };

  return createUserRoutes(controllers, tokenService);
}