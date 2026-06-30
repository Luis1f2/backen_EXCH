import type { Pool, RowDataPacket } from "mysql2/promise";

export interface UserSummary {
  id: string;
  nombre: string;
  email: string;
  tipoUsuario: string;
  activo: boolean;
  fechaRegistro: Date;
}

export class ListUsers {
  constructor(private readonly pool: Pool) {}

  async execute(limit = 50, offset = 0): Promise<UserSummary[]> {
    const [rows] = await this.pool.execute<RowDataPacket[]>(
      `SELECT u.id, u.nombre, u.email, tu.nombre AS tipo_usuario, u.activo, u.fecha_registro
       FROM usuario u
       JOIN tipo_usuario tu ON tu.id = u.tipo_usuario_id
       ORDER BY u.fecha_registro DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    return (rows as RowDataPacket[]).map((r) => ({
      id: r.id as string,
      nombre: r.nombre as string,
      email: r.email as string,
      tipoUsuario: r.tipo_usuario as string,
      activo: Boolean(r.activo),
      fechaRegistro: r.fecha_registro as Date
    }));
  }
}
