import { AppError } from "../../../user/application/errors/AppError.js";
import type { Category } from "../../domain/entities/Category.js";
import type {
  CategoryRepository,
  UpdateCategoryData,
} from "../../domain/repositories/CategoryRepository.js";

export class UpdateCategory {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(id: string, data: UpdateCategoryData): Promise<Category> {
    const current = await this.repository.findById(id);

    if (!current) {
      throw new AppError("Categoría no encontrada", 404);
    }

    if (data.nombre !== undefined && data.nombre !== current.nombre) {
      const duplicate = await this.repository.findByName(data.nombre);
      if (duplicate && duplicate.id !== id) {
        throw new AppError("La categoría ya existe", 409);
      }
    }

    const aplicaAEventos = data.aplicaAEventos ?? current.aplicaAEventos;
    const aplicaADestinos = data.aplicaADestinos ?? current.aplicaADestinos;

    if (!aplicaAEventos && !aplicaADestinos) {
      throw new AppError(
        "La categoría debe aplicar al menos a eventos o destinos",
        400,
      );
    }

    const updated = await this.repository.update(id, data);

    if (!updated) {
      throw new AppError("Categoría no encontrada", 404);
    }

    return updated;
  }
}
