import { AppError } from "../../../user/application/errors/AppError.js";

import type { CategoryRepository } from "../../domain/repositories/CategoryRepository.js";

export class DeleteCategory {
  constructor(
    private readonly repository:
      CategoryRepository,
  ) {}

  async execute(
    id: string,
  ): Promise<void> {
    const category =
      await this.repository.findById(id);

    if (!category) {
      throw new AppError(
        "Categoría no encontrada",
        404,
      );
    }

    const isInUse =
      await this.repository.isInUse(id);

    if (isInUse) {
      throw new AppError(
        "No se puede eliminar la categoría porque está siendo utilizada por eventos o destinos",
        409,
      );
    }

    const deleted =
      await this.repository.delete(id);

    if (!deleted) {
      throw new AppError(
        "No se pudo eliminar la categoría",
        500,
      );
    }
  }
}