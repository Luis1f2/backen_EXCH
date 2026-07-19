export interface BusinessService {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  additionalPrice: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}