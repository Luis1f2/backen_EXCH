import { randomUUID } from "node:crypto";

import type { Review } from "../../domain/entities/Review.js";

import type {
  ReviewRepository
} from "../../domain/repositories/ReviewRepository.js";

import { AppError } from "../../../user/application/errors/AppError.js";

export interface CreateReviewInput {
  targetType: "destination" | "business" | "location";
  targetId: string;
  rating: number;
  comment?: string | null;
}

export class CreateReview {
  constructor(private readonly repository: ReviewRepository) {}

  async execute(
    userId: string,
    input: CreateReviewInput
  ): Promise<Review> {
    const targetExists = await this.repository.targetExists(
      input.targetType,
      input.targetId
    );

    if (!targetExists) {
      throw new AppError("Entidad a reseñar no encontrada", 404);
    }

    const existingReview =
      await this.repository.findByUserAndTarget(
        userId,
        input.targetType,
        input.targetId
      );

    if (existingReview) {
      throw new AppError("Ya tienes una reseña para esta entidad", 409);
    }

    return this.repository.create({
      id: randomUUID(),
      userId,
      targetType: input.targetType,
      targetId: input.targetId,
      rating: input.rating,
      comment: input.comment ?? null
    });
  }
}