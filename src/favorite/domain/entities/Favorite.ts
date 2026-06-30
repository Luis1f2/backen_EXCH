export type FavoriteTargetType = "destination" | "business";

export interface Favorite {
  userId: string;
  targetType: FavoriteTargetType;
  targetId: string;
  addedAt: Date;
}