import type { Pool } from "pg";

import { RegisterUser } from "../application/usecase/RegisterUser.js";
import { LoginUser } from "../application/usecase/LoginUser.js";
import { GetUserProfile } from "../application/usecase/GetUserProfile.js";
import { UpdateUserProfile } from "../application/usecase/UpdateUserProfile.js";
import { DeleteUserProfile } from "../application/usecase/DeleteUserProfile.js";
import {GetUserInterests} from "../application/usecase/GetUserInterests.js";
import {UpdateUserInterests} from "../application/usecase/UpdateUserInterests.js";

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
import {GetUserInterestsController} from "./controller/GetUserInterestsController.js";
import {UpdateUserInterestsController} from "./controller/UpdateUserInterestsController.js";

import { createUserRoutes } from "./routes/UserRoutes.js";

export function createUserModule(
  pool: Pool,
  jwtSecret: string
) {
  const repository = new MySqlUserRepository(pool);
  const passwordHasher = new BcryptPasswordHasher();
  const tokenService = new JwtTokenService(jwtSecret);

 const controllers = {
  register:
    new RegisterUserController(
      new RegisterUser(
        repository,
        passwordHasher
      )
    ),

  login:
    new LoginUserController(
      new LoginUser(
        repository,
        passwordHasher,
        tokenService
      )
    ),

  getProfile:
    new GetUserProfileController(
      new GetUserProfile(repository)
    ),

  updateProfile:
    new UpdateUserProfileController(
      new UpdateUserProfile(
        repository,
        passwordHasher
      )
    ),

  deleteProfile:
    new DeleteUserProfileController(
      new DeleteUserProfile(repository)
    ),

 getUserInterests:
  new GetUserInterestsController(
    new GetUserInterests(pool)
  ),

updateUserInterests:
  new UpdateUserInterestsController(
    new UpdateUserInterests(pool)
  ),
};

  return createUserRoutes(controllers, tokenService);
}