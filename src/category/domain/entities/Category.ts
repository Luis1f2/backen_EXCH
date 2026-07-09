export interface Category {
  id: string;
  nombre: string;
  icono: string | null;
  aplicaAEventos: boolean;
  aplicaADestinos: boolean;
  totalEventosActivos: number;
}
