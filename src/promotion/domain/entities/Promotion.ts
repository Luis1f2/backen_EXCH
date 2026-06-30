export interface Promotion {
  id: string;
  titulo: string;
  descripcion: string | null;
  precio: number | null;
  negocioId: string;
  negocioNombre: string | null;
  fechaInicio: Date;
  fechaFin: Date | null;
  activo: boolean;
  fechaCreacion: Date;
}
