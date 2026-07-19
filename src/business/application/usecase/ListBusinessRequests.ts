import type { Pool } from "pg";

export type BusinessRequestStatus =
  | "pendiente"
  | "aprobada"
  | "rechazada"
  | "todas";

interface BusinessRequestRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  tipo_negocio: string;
  direccion: string | null;
  municipio: string | null;
  estado: string | null;
  imagen_url: string | null;
  estado_solicitud: "pendiente" | "aprobada" | "rechazada";
  fecha_creacion: Date;
  propietario_nombre: string | null;
  propietario_email: string | null;
}

export interface BusinessRequest {
  id: string;
  name: string;
  description: string | null;
  businessTypeName: string;
  address: string | null;
  municipality: string | null;
  state: string | null;
  imageUrl: string | null;
  requestStatus: "pendiente" | "aprobada" | "rechazada";
  createdAt: Date;
  owner: {
    name: string | null;
    email: string | null;
  };
}

export class ListBusinessRequests {
  constructor(private readonly pool: Pool) {}

  async execute(
    status: BusinessRequestStatus = "todas",
    limit = 100,
    offset = 0,
  ): Promise<BusinessRequest[]> {
    let p = 0;
    const conditions: string[] = [
      "n.activo = true",
      "na.activo = true",
      "na.rol = 'propietario'",
    ];

    const values: Array<string | number> = [];

    if (status !== "todas") {
      conditions.push(`na.estado_solicitud = $${++p}`);
      values.push(status);
    }

    values.push(limit);
    values.push(offset);

    const { rows } = await this.pool.query<BusinessRequestRow>(
      `SELECT
         n.id,
         n.nombre,
         n.descripcion,
         tn.nombre AS tipo_negocio,
         u.direccion,
         u.municipio,
         u.estado,
         n.imagen_url,
         na.estado_solicitud,
         n.fecha_creacion,
         propietario.nombre AS propietario_nombre,
         propietario.email AS propietario_email
       FROM negocio_turistico n
       INNER JOIN tipo_negocio tn ON tn.id = n.tipo_negocio_id
       INNER JOIN ubicacion u ON u.id = n.ubicacion_id
       INNER JOIN negocio_administrador na ON na.negocio_id = n.id
       INNER JOIN usuario propietario ON propietario.id = na.usuario_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY
         CASE na.estado_solicitud
           WHEN 'pendiente' THEN 1
           WHEN 'aprobada' THEN 2
           WHEN 'rechazada' THEN 3
           ELSE 4
         END,
         n.fecha_creacion DESC
       LIMIT $${p + 1} OFFSET $${p + 2}`,
      values,
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.nombre,
      description: row.descripcion,
      businessTypeName: row.tipo_negocio,
      address: row.direccion,
      municipality: row.municipio,
      state: row.estado,
      imageUrl: row.imagen_url,
      requestStatus: row.estado_solicitud,
      createdAt: row.fecha_creacion,
      owner: {
        name: row.propietario_nombre,
        email: row.propietario_email,
      },
    }));
  }
}
