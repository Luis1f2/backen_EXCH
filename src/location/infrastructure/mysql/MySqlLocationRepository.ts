import type { Pool } from "pg";

import type { Location } from "../../domain/entities/Location.js";

import type {
  CreateLocationData,
  ListLocationsFilters,
  LocationRepository,
  UpdateLocationData
} from "../../domain/repositories/LocationRepository.js";

interface LocationRow {
  id: string;
  latitud: string;
  longitud: string;
  direccion: string | null;
  municipio: string | null;
  estado: string | null;
  origen_id: string | null;
  proveedor_mapa: string | null;
  proveedor_place_id: string | null;
  creado_por_usuario_id: string | null;
  estado_revision_id: string | null;
  fecha_creacion: Date;
}

interface CatalogRow {
  id: string;
}

type SqlValue = string | number | boolean | Date | Buffer | null;

export class MySqlLocationRepository implements LocationRepository {
  constructor(private readonly databasePool: Pool) {}

  async create(data: CreateLocationData): Promise<Location> {
    await this.databasePool.query(
      `INSERT INTO ubicacion (
        id,
        latitud,
        longitud,
        direccion,
        municipio,
        estado,
        origen_id,
        proveedor_mapa,
        proveedor_place_id,
        creado_por_usuario_id,
        estado_revision_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        data.id,
        data.latitude,
        data.longitude,
        data.address,
        data.municipality,
        data.state,
        data.originId,
        data.mapProvider,
        data.providerPlaceId,
        data.createdByUserId,
        data.reviewStatusId
      ]
    );

    const location = await this.findById(data.id);

    if (!location) {
      throw new Error("No se pudo recuperar la ubicación creada");
    }

    return location;
  }

  async findById(id: string): Promise<Location | null> {
    const { rows } = await this.databasePool.query<LocationRow>(
      `SELECT
        id,
        latitud,
        longitud,
        direccion,
        municipio,
        estado,
        origen_id,
        proveedor_mapa,
        proveedor_place_id,
        creado_por_usuario_id,
        estado_revision_id,
        fecha_creacion
       FROM ubicacion
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    const row = rows[0];

    return row ? this.mapToDomain(row) : null;
  }

  async list(filters: ListLocationsFilters): Promise<Location[]> {
    let p = 0;
    const conditions: string[] = [];
    const values: SqlValue[] = [];

    if (filters.municipality) {
      conditions.push(`municipio = $${++p}`);
      values.push(filters.municipality);
    }

    if (filters.state) {
      conditions.push(`estado = $${++p}`);
      values.push(filters.state);
    }

    values.push(filters.limit);
    values.push(filters.offset);

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const { rows } = await this.databasePool.query<LocationRow>(
      `SELECT
        id,
        latitud,
        longitud,
        direccion,
        municipio,
        estado,
        origen_id,
        proveedor_mapa,
        proveedor_place_id,
        creado_por_usuario_id,
        estado_revision_id,
        fecha_creacion
       FROM ubicacion
       ${where}
       ORDER BY fecha_creacion DESC
       LIMIT $${p + 1}
       OFFSET $${p + 2}`,
      values
    );

    return rows.map((row) => this.mapToDomain(row));
  }

  async update(
    id: string,
    data: UpdateLocationData
  ): Promise<Location | null> {
    let p = 0;
    const fields: string[] = [];
    const values: SqlValue[] = [];

    if (data.latitude !== undefined) {
      fields.push(`latitud = $${++p}`);
      values.push(data.latitude);
    }

    if (data.longitude !== undefined) {
      fields.push(`longitud = $${++p}`);
      values.push(data.longitude);
    }

    if (data.address !== undefined) {
      fields.push(`direccion = $${++p}`);
      values.push(data.address);
    }

    if (data.municipality !== undefined) {
      fields.push(`municipio = $${++p}`);
      values.push(data.municipality);
    }

    if (data.state !== undefined) {
      fields.push(`estado = $${++p}`);
      values.push(data.state);
    }

    if (data.mapProvider !== undefined) {
      fields.push(`proveedor_mapa = $${++p}`);
      values.push(data.mapProvider);
    }

    if (data.providerPlaceId !== undefined) {
      fields.push(`proveedor_place_id = $${++p}`);
      values.push(data.providerPlaceId);
    }

    if (data.reviewStatusId !== undefined) {
      fields.push(`estado_revision_id = $${++p}`);
      values.push(data.reviewStatusId);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    await this.databasePool.query(
      `UPDATE ubicacion
       SET ${fields.join(", ")}
       WHERE id = $${p + 1}`,
      values
    );

    return this.findById(id);
  }

  async findOriginIdByName(name: string): Promise<string | null> {
    return this.findCatalogIdByName("origen_ubicacion", name);
  }

  async findReviewStatusIdByName(name: string): Promise<string | null> {
    return this.findCatalogIdByName("estado_revision", name);
  }

  private async findCatalogIdByName(
    table: "origen_ubicacion" | "estado_revision",
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

  private mapToDomain(row: LocationRow): Location {
    return {
      id: row.id,
      latitude: Number(row.latitud),
      longitude: Number(row.longitud),
      address: row.direccion,
      municipality: row.municipio,
      state: row.estado,
      originId: row.origen_id,
      mapProvider: row.proveedor_mapa,
      providerPlaceId: row.proveedor_place_id,
      createdByUserId: row.creado_por_usuario_id,
      reviewStatusId: row.estado_revision_id,
      createdAt: row.fecha_creacion
    };
  }
}
