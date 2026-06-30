export interface Business {
  id: string;
  name: string;
  description: string | null;
  businessTypeId: string;
  locationId: string;
  priceFrom: number | null;
  isVerified: boolean;
  active: boolean;
  createdAt: Date;
  averageRating: number;
  totalReviews: number;
}