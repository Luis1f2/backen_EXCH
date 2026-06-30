import type { Pool, RowDataPacket } from "mysql2/promise";

interface CountRow extends RowDataPacket {
  total: number;
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
      this.count("SELECT COUNT(*) AS total FROM usuario WHERE activo = 1"),
      this.count("SELECT COUNT(*) AS total FROM destino WHERE activo = 1"),
      this.count("SELECT COUNT(*) AS total FROM negocio_turistico WHERE activo = 1"),
      this.count("SELECT COUNT(*) AS total FROM negocio_turistico WHERE esta_verificado = 1 AND activo = 1"),
      this.count("SELECT COUNT(*) AS total FROM evento WHERE activo = 1"),
      this.count("SELECT COUNT(*) AS total FROM resena_destino"),
      this.count("SELECT COUNT(*) AS total FROM ruta"),
      this.count("SELECT COUNT(*) AS total FROM favorito_destino"),
      this.count("SELECT COUNT(*) AS total FROM favorito_negocio")
    ];

    const results = await Promise.all(queries);

    return {
      totalUsuarios:         results[0][0]?.total ?? 0,
      totalDestinos:         results[1][0]?.total ?? 0,
      totalNegocios:         results[2][0]?.total ?? 0,
      negociosVerificados:   results[3][0]?.total ?? 0,
      totalEventos:          results[4][0]?.total ?? 0,
      totalResenas:          results[5][0]?.total ?? 0,
      totalRutas:            results[6][0]?.total ?? 0,
      totalFavoritosDestinos: results[7][0]?.total ?? 0,
      totalFavoritosNegocios: results[8][0]?.total ?? 0
    };
  }

  private async count(sql: string): Promise<CountRow[]> {
    const [rows] = await this.pool.execute<CountRow[]>(sql);
    return rows;
  }
}
