import type {
  Conversacion,
  ConversacionConMensajes,
  MensajeChat,
} from "../entities/Conversacion.js";

export interface ChatRepository {
  crearConversacion(usuarioId: string, titulo?: string): Promise<Conversacion>;
  listarConversaciones(usuarioId: string): Promise<Conversacion[]>;
  obtenerConversacion(id: string, usuarioId: string): Promise<ConversacionConMensajes | null>;
 agregarMensaje(
  conversacionId: string,
  usuarioId: string,
  rol: "user" | "bot",
  contenido: string,
): Promise<MensajeChat | null>;
  eliminarConversacion(id: string, usuarioId: string): Promise<boolean>;
}
