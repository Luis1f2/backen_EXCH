import type { Pool } from "pg";

interface CountRow {
  total: string;
}

export interface SystemStats {
  totalUsuarios: number;
  totalDestinos: number;
  totalNegocios: number;
  negociosVerificados: number;
  totalEventos: number;
  totalResenas: number;
  totalRutas: number;
  totalFavoritosDestinos: number;
  totalFavoritosNegocios: number;
}

export class GetSystemStats {
  constructor(private readonly pool: Pool) {}

  async execute(): Promise<SystemStats> {
    const queries: Promise<CountRow[]>[] = [
      this.count("SELECT COUNT(*) AS total FROM usuario WHERE activo = true"),
      this.count("SELECT COUNT(*) AS total FROM destino WHERE activo = true"),
      this.count("SELECT COUNT(*) AS total FROM negocio_turistico WHERE activo = true"),
      this.count("SELECT COUNT(*) AS total FROM negocio_turistico WHERE esta_verificado = true AND activo = true"),
      this.count("SELECT COUNT(*) AS total FROM evento WHERE activo = true"),
      this.count("SELECT COUNT(*) AS total FROM resena_destino"),
      this.count("SELECT COUNT(*) AS total FROM ruta"),
      this.count("SELECT COUNT(*) AS total FROM favorito_destino"),
      this.count("SELECT COUNT(*) AS total FROM favorito_negocio")
    ];

    const results = await Promise.all(queries);

    return {
      totalUsuarios:          Number(results[0][0]?.total ?? 0),
      totalDestinos:          Number(results[1][0]?.total ?? 0),
      totalNegocios:          Number(results[2][0]?.total ?? 0),
      negociosVerificados:    Number(results[3][0]?.total ?? 0),
      totalEventos:           Number(results[4][0]?.total ?? 0),
      totalResenas:           Number(results[5][0]?.total ?? 0),
      totalRutas:             Number(results[6][0]?.total ?? 0),
      totalFavoritosDestinos: Number(results[7][0]?.total ?? 0),
      totalFavoritosNegocios: Number(results[8][0]?.total ?? 0)
    };
  }

  private async count(sql: string): Promise<CountRow[]> {
    const { rows } = await this.pool.query<CountRow>(sql);
    return rows;
  }
}
