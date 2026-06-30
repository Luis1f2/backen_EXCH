export interface Destino {
  id: string;
  nombre: string;
  tipo: string;
  descripcion: string;
  lat: number;
  lng: number;
  calificacion: number;
  afluencia: number;
  esSostenible: boolean;
}

export function toDestinoResponse(destino: Destino) {
  const { esSostenible, ...resto } = destino;
  return { ...resto, es_sostenible: esSostenible };
}
