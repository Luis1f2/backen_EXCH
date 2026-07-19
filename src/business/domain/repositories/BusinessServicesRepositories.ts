import type { BusinessService } from "../entities/BusinessServices.js";

export interface CreateBusinessServiceData {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  additionalPrice: number | null;
}

export interface UpdateBusinessServiceData {
  name?: string;
  description?: string | null;
  additionalPrice?: number | null;
}

export interface BusinessServiceRepository {
  listByBusinessId(
    businessId: string
  ): Promise<BusinessService[]>;

  findById(
    serviceId: string
  ): Promise<BusinessService | null>;

  create(
    data: CreateBusinessServiceData
  ): Promise<BusinessService>;

  update(
    serviceId: string,
    data: UpdateBusinessServiceData
  ): Promise<BusinessService | null>;

  delete(serviceId: string): Promise<boolean>;
}
