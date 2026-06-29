import type { Review } from "../../domain/entities/Review.js";

import type {
  ReviewRepository,
  UpdateReviewData
} from "../../domain/repositories/ReviewRepository.js";

import { AppError } from "../../../user/applications/errors/AppError.js";

export interface UpdateReviewInput {
  rating?: number;
  comment?: string | null;
}

export class UpdateReview {
  constructor(private readonly repository: ReviewRepository) {}

  async execute(
    userId: string,
    reviewId: string,
    input: UpdateReviewInput
  ): Promise<Review> {
    const review = await this.repository.findById(reviewId);

    if (!review) {
      throw new AppError("Reseña no encontrada", 404);
    }

    if (review.userId !== userId) {
      throw new AppError("No tienes permisos para modificar esta reseña", 403);
    }

    const updateData: UpdateReviewData = {};

    if (input.rating !== undefined) {
      updateData.rating = input.rating;
    }

    if (input.comment !== undefined) {
      updateData.comment = input.comment;
    }

    const updatedReview = await this.repository.update(
      reviewId,
      updateData
    );

    if (!updatedReview) {
      throw new AppError("No se pudo actualizar la reseña", 500);
    }

    return updatedReview;
  }
}