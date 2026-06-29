import type {
  Review,
  ReviewTargetType
} from "../entities/Review.js";

export interface CreateReviewData {
  id: string;
  userId: string;
  targetType: ReviewTargetType;
  targetId: string;
  rating: number;
  comment: string | null;
}

export interface UpdateReviewData {
  rating?: number;
  comment?: string | null;
}

export interface ListReviewsFilters {
  targetType: ReviewTargetType;
  targetId: string;
}

export interface ReviewRepository {
  create(data: CreateReviewData): Promise<Review>;
  findById(id: string): Promise<Review | null>;

  findByUserAndTarget(
    userId: string,
    targetType: ReviewTargetType,
    targetId: string
  ): Promise<Review | null>;

  list(filters: ListReviewsFilters): Promise<Review[]>;

  update(
    id: string,
    data: UpdateReviewData
  ): Promise<Review | null>;

  delete(id: string): Promise<boolean>;

  targetExists(
    targetType: ReviewTargetType,
    targetId: string
  ): Promise<boolean>;
}