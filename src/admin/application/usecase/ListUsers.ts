import type { Pool } from "pg";

export interface UserSummary {
  id: string;
  nombre: string;
  email: string;
  tipoUsuario: string;
  activo: boolean;
  fechaRegistro: Date;
}

interface UserRow {
  id: string;
  nombre: string;
  email: string;
  tipo_usuario: string;
  activo: boolean;
  fecha_registro: Date;
}

export class ListUsers {
  constructor(private readonly pool: Pool) {}

  async execute(limit = 50, offset = 0): Promise<UserSummary[]> {
    const { rows } = await this.pool.query<UserRow>(
      `SELECT u.id, u.nombre, u.email, tu.nombre AS tipo_usuario, u.activo, u.fecha_registro
       FROM usuario u
       JOIN tipo_usuario tu ON tu.id = u.tipo_usuario_id
       ORDER BY u.fecha_registro DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      email: r.email,
      tipoUsuario: r.tipo_usuario,
      activo: Boolean(r.activo),
      fechaRegistro: r.fecha_registro
    }));
  }
}
