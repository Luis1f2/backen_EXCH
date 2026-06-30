import type { Destino } from "../entities/Destino.js";

export interface BusquedaCercanos {
  lat: number;
  lng: number;
  radioKm: number;
  tipo?: string;
}

export interface DestinoRepository {
  listar(tipo?: string): Promise<Destino[]>;
  listarCercanos(busqueda: BusquedaCercanos): Promise<Destino[]>;
  obtenerPorId(id: string): Promise<Destino | null>;
}
