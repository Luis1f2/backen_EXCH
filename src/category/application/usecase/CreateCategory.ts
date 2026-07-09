import { randomUUID } from "node:crypto";
import { AppError } from "../../../user/application/errors/AppError.js";
import type { Category } from "../../domain/entities/Category.js";
import type { CategoryRepository } from "../../domain/repositories/CategoryRepository.js";

export interface CreateCategoryInput {
  nombre: string;
  icono?: string | null;
  aplicaAEventos?: boolean;
  aplicaADestinos?: boolean;
}

export class CreateCategory {
  constructor(private readonly repository: CategoryRepository) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    const aplicaAEventos = input.aplicaAEventos ?? true;
    const aplicaADestinos = input.aplicaADestinos ?? false;

    if (!aplicaAEventos && !aplicaADestinos) {
      throw new AppError(
        "La categoría debe aplicar al menos a eventos o destinos",
        400,
      );
    }

    const existing = await this.repository.findByName(input.nombre);
    if (existing) {
      throw new AppError("La categoría ya existe", 409);
    }

    return this.repository.create({
      id: randomUUID(),
      nombre: input.nombre,
      icono: input.icono ?? null,
      aplicaAEventos,
      aplicaADestinos,
    });
  }
}
