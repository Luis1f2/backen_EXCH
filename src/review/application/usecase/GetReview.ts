import type { Review } from "../../domain/entities/Review.js";
import type { ReviewRepository } from "../../domain/repositories/ReviewRepository.js";
import { AppError } from "../../../user/application/errors/AppError.js";

export class GetReview {
  constructor(private readonly repository: ReviewRepository) {}

  async execute(id: string): Promise<Review> {
    const review = await this.repository.findById(id);

    if (!review) {
      throw new AppError("Reseña no encontrada", 404);
    }

    return review;
  }
}