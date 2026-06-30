import type { RouteRepository } from "../../domain/repositories/RouteRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export class DeleteRoute {
  constructor(private readonly repository: RouteRepository) {}

  async execute(
    userId: string,
    routeId: string
  ): Promise<void> {
    const route = await this.repository.findById(routeId);

    if (!route) {
      throw new AppError("Ruta no encontrada", 404);
    }

    if (route.userId !== userId) {
      throw new AppError("No tienes permisos para eliminar esta ruta", 403);
    }

    const deleted = await this.repository.delete(routeId);

    if (!deleted) {
      throw new AppError("No se pudo eliminar la ruta", 500);
    }
  }
}