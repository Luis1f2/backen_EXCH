import type { Category } from "../../domain/entities/Category.js";
import type {
  CategoryRepository,
  CategoryScope,
} from "../../domain/repositories/CategoryRepository.js";

export class ListCategories {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(scope: CategoryScope = "eventos"): Promise<Category[]> {
    return this.repository.list(scope);
  }
}
