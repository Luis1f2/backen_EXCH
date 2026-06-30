import type { Event } from "../entities/Event.js";

export interface CreateEventData {
  id: string;
  titulo: string;
  descripcion?: string | null;
  fechaInicio: Date;
  fechaFin?: Date | null;
  ubicacionId?: string | null;
  categoriaId?: string | null;
  creadoPor: string;
}

export interface UpdateEventData {
  titulo?: string;
  descripcion?: string | null;
  fechaInicio?: Date;
  fechaFin?: Date | null;
  ubicacionId?: string | null;
  categoriaId?: string | null;
}

export interface EventRepository {
  list(proximasOnly?: boolean): Promise<Event[]>;
  findById(id: string): Promise<Event | null>;
  create(data: CreateEventData): Promise<Event>;
  update(id: string, data: UpdateEventData): Promise<Event | null>;
  delete(id: string): Promise<boolean>;
}
