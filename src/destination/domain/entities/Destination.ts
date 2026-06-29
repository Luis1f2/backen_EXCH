export interface Destination {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  locationId: string;
  active: boolean;
  createdAt: Date;
  averageRating: number;
  totalReviews: number;
  isSaturated: boolean;
}