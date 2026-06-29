import type { Pool } from "mysql2/promise";

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
  pool: Pool,
  jwtSecret: string
) {
  const repository = new MySqlUserRepository(pool);
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService(jwtSecret);

  const controllers = {
    register: new RegisterUserController(
      new RegisterUser(
        repository,
        passwordHasher
      )
    ),
    login: new LoginUserController(
      new LoginUser(
        repository,
        passwordHasher,
        tokenService
      )
    ),
    getProfile: new GetUserProfileController(
      new GetUserProfile(repository)
    ),
    updateProfile: new UpdateUserProfileController(
      new UpdateUserProfile(repository, passwordHasher)
    ),
    deleteProfile: new DeleteUserProfileController(
      new DeleteUserProfile(repository)
    )
  };

  return createUserRoutes(controllers, tokenService);
}