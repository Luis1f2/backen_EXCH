import type { Pool } from "pg";
import type { ChatRepository } from "../domain/repositories/ChatRepository.js";
import type {
  Conversacion,
  ConversacionConMensajes,
  MensajeChat,
} from "../domain/entities/Conversacion.js";

export class PgChatRepository implements ChatRepository {
  constructor(private readonly pool: Pool) {}

  async crearConversacion(usuarioId: string, titulo?: string): Promise<Conversacion> {
    const { rows } = await this.pool.query<ConversacionRow>(
      `INSERT INTO conversacion (usuario_id, titulo)
       VALUES ($1, $2)
       RETURNING id, usuario_id, titulo, creado_en, actualizado_en`,
      [usuarioId, titulo ?? null],
    );
    return toConversacion(rows[0]);
  }

  async listarConversaciones(usuarioId: string): Promise<Conversacion[]> {
    const { rows } = await this.pool.query<ConversacionRow>(
      `SELECT id, usuario_id, titulo, creado_en, actualizado_en
       FROM conversacion
       WHERE usuario_id = $1
       ORDER BY actualizado_en DESC`,
      [usuarioId],
    );
    return rows.map(toConversacion);
  }

  async obtenerConversacion(
    id: string,
    usuarioId: string,
  ): Promise<ConversacionConMensajes | null> {
    const { rows: convRows } = await this.pool.query<ConversacionRow>(
      `SELECT id, usuario_id, titulo, creado_en, actualizado_en
       FROM conversacion
       WHERE id = $1 AND usuario_id = $2`,
      [id, usuarioId],
    );
    if (!convRows[0]) return null;

    const { rows: msgRows } = await this.pool.query<MensajeRow>(
      `SELECT id, conversacion_id, rol, contenido, creado_en
       FROM mensaje_chat
       WHERE conversacion_id = $1
       ORDER BY creado_en ASC`,
      [id],
    );

    return {
      ...toConversacion(convRows[0]),
      mensajes: msgRows.map(toMensaje),
    };
  }

  async agregarMensaje(
    conversacionId: string,
    rol: "user" | "bot",
    contenido: string,
  ): Promise<MensajeChat> {
    const { rows } = await this.pool.query<MensajeRow>(
      `INSERT INTO mensaje_chat (conversacion_id, rol, contenido)
       VALUES ($1, $2, $3)
       RETURNING id, conversacion_id, rol, contenido, creado_en`,
      [conversacionId, rol, contenido],
    );
    // Actualizar timestamp de la conversación para ordenar por actividad
    await this.pool.query(
      `UPDATE conversacion SET actualizado_en = NOW() WHERE id = $1`,
      [conversacionId],
    );
    return toMensaje(rows[0]);
  }

  async eliminarConversacion(id: string, usuarioId: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      `DELETE FROM conversacion WHERE id = $1 AND usuario_id = $2`,
      [id, usuarioId],
    );
    return (rowCount ?? 0) > 0;
  }
}

interface ConversacionRow {
  id: string;
  usuario_id: string;
  titulo: string | null;
  creado_en: Date;
  actualizado_en: Date;
}

interface MensajeRow {
  id: string;
  conversacion_id: string;
  rol: string;
  contenido: string;
  creado_en: Date;
}

function toConversacion(row: ConversacionRow): Conversacion {
  return {
    id: row.id,
    usuarioId: row.usuario_id,
    titulo: row.titulo,
    creadoEn: row.creado_en,
    actualizadoEn: row.actualizado_en,
  };
}

function toMensaje(row: MensajeRow): MensajeChat {
  return {
    id: row.id,
    conversacionId: row.conversacion_id,
    rol: row.rol as "user" | "bot",
    contenido: row.contenido,
    creadoEn: row.creado_en,
  };
}
