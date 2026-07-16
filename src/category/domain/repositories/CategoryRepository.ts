import type { Category } from "../entities/Category.js";

export type CategoryScope = "eventos" | "destinos" | "todos";

export interface CreateCategoryData {
  id: string;
  nombre: string;
  icono?: string | null;
  aplicaAEventos: boolean;
  aplicaADestinos: boolean;
}

export interface UpdateCategoryData {
  nombre?: string;
  icono?: string | null;
  aplicaAEventos?: boolean;
  aplicaADestinos?: boolean;
}

export interface CategoryRepository {
  list(scope?: CategoryScope): Promise<Category[]>;

  findById(id: string): Promise<Category | null>;

  findByName(nombre: string): Promise<Category | null>;

  create(data: CreateCategoryData): Promise<Category>;

  update(
    id: string,
    data: UpdateCategoryData,
  ): Promise<Category | null>;

  isInUse(id: string): Promise<boolean>;

  delete(id: string): Promise<boolean>;
}