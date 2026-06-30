export type ReviewTargetType = "destination" | "business" | "location";

export interface Review {
  id: string;
  userId: string;
  targetType: ReviewTargetType;
  targetId: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
}