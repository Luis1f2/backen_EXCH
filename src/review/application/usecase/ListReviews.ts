import type { Review } from "../../domain/entities/Review.js";

import type {
  ListReviewsFilters,
  ReviewRepository
} from "../../domain/repositories/ReviewRepository.js";

export class ListReviews {
  constructor(private readonly repository: ReviewRepository) {}

  async execute(filters: ListReviewsFilters): Promise<Review[]> {
    return this.repository.list(filters);
  }
}