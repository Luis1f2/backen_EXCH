export interface Event {
  id: string;
  titulo: string;
  descripcion: string | null;
  imagenUrl: string | null;
  fechaInicio: Date;
  fechaFin: Date | null;
  ubicacionId: string | null;
  categoriaId: string | null;
  categoriaNombre: string | null;
  municipio: string | null;
  activo: boolean;
  fechaCreacion: Date;
}