export interface Business {
  id: string;
  name: string;
  description: string | null;
  businessTypeId: string;
  locationId: string;
  priceFrom: number | null;
  imageUrl: string | null;
  isVerified: boolean;
  active: boolean;
  createdAt: Date;
  averageRating: number;
  totalReviews: number;
}