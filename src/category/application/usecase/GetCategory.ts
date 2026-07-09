import { AppError } from "../../../user/application/errors/AppError.js";
import type { Category } from "../../domain/entities/Category.js";
import type { CategoryRepository } from "../../domain/repositories/CategoryRepository.js";

export class GetCategory {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(id: string): Promise<Category> {
    const category = await this.repository.findById(id);

    if (!category) {
      throw new AppError("Categoría no encontrada", 404);
    }

    return category;
  }
}
