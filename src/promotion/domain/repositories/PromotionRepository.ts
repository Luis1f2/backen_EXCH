import type { Promotion } from "../entities/Promotion.js";

export interface CreatePromotionData {
  id: string;
  titulo: string;
  descripcion?: string | null;
  precio?: number | null;
  negocioId: string;
  fechaInicio: Date;
  fechaFin?: Date | null;
  creadoPor: string;
}

export interface UpdatePromotionData {
  titulo?: string;
  descripcion?: string | null;
  precio?: number | null;
  fechaInicio?: Date;
  fechaFin?: Date | null;
}

export interface PromotionRepository {
  listByBusiness(negocioId: string): Promise<Promotion[]>;
  listActive(): Promise<Promotion[]>;
  findById(id: string): Promise<Promotion | null>;
  create(data: CreatePromotionData): Promise<Promotion>;
  update(id: string, data: UpdatePromotionData): Promise<Promotion | null>;
  delete(id: string): Promise<boolean>;
  isOwner(promotionId: string, userId: string): Promise<boolean>;
  isBusinessOwner(negocioId: string, userId: string): Promise<boolean>;
}
