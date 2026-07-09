import type { Pool } from "mysql2/promise";
import { JwtTokenService } from "../../user/infrastructure/security/SecurityAdapters.js";
import { ListCategories } from "../application/usecase/ListCategories.js";
import { GetCategory } from "../application/usecase/GetCategory.js";
import { CreateCategory } from "../application/usecase/CreateCategory.js";
import { UpdateCategory } from "../application/usecase/UpdateCategory.js";
import { MySqlCategoryRepository } from "./mysql/MySqlCategoryRepository.js";
import { ListCategoriesController } from "./controller/ListCategoriesController.js";
import { GetCategoryController } from "./controller/GetCategoryController.js";
import { CreateCategoryController } from "./controller/CreateCategoryController.js";
import { UpdateCategoryController } from "./controller/UpdateCategoryController.js";
import { createCategoryRoutes } from "./routes/categoryRoutes.js";

export function createCategoryModule(pool: Pool, jwtSecret: string) {
  const repository = new MySqlCategoryRepository(pool);
  const tokenService = new JwtTokenService(jwtSecret);

  const controllers = {
    list: new ListCategoriesController(new ListCategories(repository)),
    get: new GetCategoryController(new GetCategory(repository)),
    create: new CreateCategoryController(new CreateCategory(repository)),
    update: new UpdateCategoryController(new UpdateCategory(repository)),
  };

  return createCategoryRoutes(controllers, pool, tokenService);
}
