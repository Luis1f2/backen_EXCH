import type { ReviewRepository } from "../../domain/repositories/ReviewRepository.js";
import { AppError } from "../../../user/applications/errors/AppError.js";

export class DeleteReview {
  constructor(private readonly repository: ReviewRepository) {}

  async execute(
    userId: string,
    reviewId: string
  ): Promise<void> {
    const review = await this.repository.findById(reviewId);

    if (!review) {
      throw new AppError("Reseña no encontrada", 404);
    }

    if (review.userId !== userId) {
      throw new AppError("No tienes permisos para eliminar esta reseña", 403);
    }

    const deleted = await this.repository.delete(reviewId);

    if (!deleted) {
      throw new AppError("No se pudo eliminar la reseña", 500);
    }
  }
}