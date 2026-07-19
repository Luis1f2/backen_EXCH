import type { Pool } from "pg";

import type {
  Alert,
  AlertEntityType
} from "../../domain/entities/Alert.js";

import type {
  AlertRepository,
  CreateAlertData,
  ListAlertsFilters
} from "../../domain/repositories/AlertRepository.js";

interface AlertRow {
  id: string;
  tipo_id: string;
  tipo_nombre: string;
  descripcion: string;
  estado_id: string;
  estado_nombre: string;
  ambito_id: string;
  ambito_nombre: string;
  entidad_tipo_id: string | null;
  entidad_tipo_nombre: AlertEntityType | null;
  entidad_id: string | null;
  fecha_generada: Date;
  usuario_atendio_id: string | null;
}

interface CatalogRow {
  id: string;
}

interface ExistsRow {
  total: string;
}

type SqlValue = string | number | boolean | Date | Buffer | null;

export class MySqlAlertRepository implements AlertRepository {
  constructor(private readonly databasePool: Pool) {}

  async create(data: CreateAlertData): Promise<Alert> {
    await this.databasePool.query(
      `INSERT INTO alerta (
        id,
        tipo_id,
        descripcion,
        estado_id,
        ambito_id,
        entidad_tipo_id,
        entidad_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        data.id,
        data.typeId,
        data.description,
        data.statusId,
        data.scopeId,
        data.entityTypeId,
        data.entityId
      ]
    );

    const alert = await this.findById(data.id);

    if (!alert) {
      throw new Error("No se pudo recuperar la alerta creada");
    }

    return alert;
  }

  async findById(id: string): Promise<Alert | null> {
    const { rows } = await this.databasePool.query<AlertRow>(
      `${this.baseSelect()}
       WHERE a.id = $1
       LIMIT 1`,
      [id]
    );

    const row = rows[0];

    return row ? this.mapToDomain(row) : null;
  }

  async list(filters: ListAlertsFilters): Promise<Alert[]> {
    let p = 0;
    const conditions: string[] = [];
    const values: SqlValue[] = [];

    if (filters.typeName) {
      conditions.push(`ta.nombre = $${++p}`);
      values.push(filters.typeName);
    }

    if (filters.statusName) {
      conditions.push(`ea.nombre = $${++p}`);
      values.push(filters.statusName);
    }

    if (filters.scopeName) {
      conditions.push(`aa.nombre = $${++p}`);
      values.push(filters.scopeName);
    }

    if (filters.entityTypeName) {
      conditions.push(`tea.nombre = $${++p}`);
      values.push(filters.entityTypeName);
    }

    if (filters.entityId) {
      conditions.push(`a.entidad_id = $${++p}`);
      values.push(filters.entityId);
    }

    values.push(filters.limit);
    values.push(filters.offset);

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const { rows } = await this.databasePool.query<AlertRow>(
      `${this.baseSelect()}
       ${where}
       ORDER BY a.fecha_generada DESC
       LIMIT $${p + 1}
       OFFSET $${p + 2}`,
      values
    );

    return rows.map((row) => this.mapToDomain(row));
  }

  async markAsAttended(
    id: string,
    userId: string
  ): Promise<Alert | null> {
    const statusId = await this.findStatusIdByName("atendida");

    if (!statusId) {
      throw new Error("Estado atendida no encontrado");
    }

    await this.databasePool.query(
      `UPDATE alerta
       SET estado_id = $1,
           usuario_atendio_id = $2
       WHERE id = $3`,
      [statusId, userId, id]
    );

    return this.findById(id);
  }

  async discard(
    id: string,
    userId: string
  ): Promise<Alert | null> {
    const statusId = await this.findStatusIdByName("descartada");

    if (!statusId) {
      throw new Error("Estado descartada no encontrado");
    }

    await this.databasePool.query(
      `UPDATE alerta
       SET estado_id = $1,
           usuario_atendio_id = $2
       WHERE id = $3`,
      [statusId, userId, id]
    );

    return this.findById(id);
  }

  async findTypeIdByName(name: string): Promise<string | null> {
    return this.findCatalogIdByName("tipo_alerta", name);
  }

  async findStatusIdByName(name: string): Promise<string | null> {
    return this.findCatalogIdByName("estado_alerta", name);
  }

  async findScopeIdByName(name: string): Promise<string | null> {
    return this.findCatalogIdByName("ambito_alerta", name);
  }

  async findEntityTypeIdByName(
    name: AlertEntityType
  ): Promise<string | null> {
    return this.findCatalogIdByName("tipo_entidad_alerta", name);
  }

  async entityExists(
    entityType: AlertEntityType,
    entityId: string
  ): Promise<boolean> {
    const config = this.getEntityTableConfig(entityType);

    const activeCondition =
      config.activeColumn === null
        ? ""
        : `AND ${config.activeColumn} = true`;

    const { rows } = await this.databasePool.query<ExistsRow>(
      `SELECT COUNT(*) AS total
       FROM ${config.table}
       WHERE id = $1
       ${activeCondition}`,
      [entityId]
    );

    return Number(rows[0]?.total ?? 0) > 0;
  }

  private async findCatalogIdByName(
    table:
      | "tipo_alerta"
      | "estado_alerta"
      | "ambito_alerta"
      | "tipo_entidad_alerta",
    name: string
  ): Promise<string | null> {
    const { rows } = await this.databasePool.query<CatalogRow>(
      `SELECT id
       FROM ${table}
       WHERE nombre = $1
       LIMIT 1`,
      [name]
    );

    return rows[0]?.id ?? null;
  }

  private getEntityTableConfig(
    entityType: AlertEntityType
  ): {
    table:
      | "destino"
      | "negocio_turistico"
      | "ubicacion"
      | "resena_destino"
      | "resena_negocio"
      | "resena_ubicacion";
    activeColumn: "activo" | null;
  } {
    if (entityType === "destino") {
      return { table: "destino", activeColumn: "activo" };
    }

    if (entityType === "negocio") {
      return { table: "negocio_turistico", activeColumn: "activo" };
    }

    if (entityType === "ubicacion") {
      return { table: "ubicacion", activeColumn: null };
    }

    if (entityType === "resena_destino") {
      return { table: "resena_destino", activeColumn: null };
    }

    if (entityType === "resena_negocio") {
      return { table: "resena_negocio", activeColumn: null };
    }

    return { table: "resena_ubicacion", activeColumn: null };
  }

  private baseSelect(): string {
    return `SELECT
      a.id,
      a.tipo_id,
      ta.nombre AS tipo_nombre,
      a.descripcion,
      a.estado_id,
      ea.nombre AS estado_nombre,
      a.ambito_id,
      aa.nombre AS ambito_nombre,
      a.entidad_tipo_id,
      tea.nombre AS entidad_tipo_nombre,
      a.entidad_id,
      a.fecha_generada,
      a.usuario_atendio_id
     FROM alerta a
     INNER JOIN tipo_alerta ta ON ta.id = a.tipo_id
     INNER JOIN estado_alerta ea ON ea.id = a.estado_id
     INNER JOIN ambito_alerta aa ON aa.id = a.ambito_id
     LEFT JOIN tipo_entidad_alerta tea ON tea.id = a.entidad_tipo_id`;
  }

  private mapToDomain(row: AlertRow): Alert {
    return {
      id: row.id,
      typeId: row.tipo_id,
      typeName: row.tipo_nombre,
      description: row.descripcion,
      statusId: row.estado_id,
      statusName: row.estado_nombre,
      scopeId: row.ambito_id,
      scopeName: row.ambito_nombre,
      entityTypeId: row.entidad_tipo_id,
      entityTypeName: row.entidad_tipo_nombre,
      entityId: row.entidad_id,
      generatedAt: row.fecha_generada,
      attendedByUserId: row.usuario_atendio_id
    };
  }
}
