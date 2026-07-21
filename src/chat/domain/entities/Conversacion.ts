export interface Conversacion {
  id: string;
  usuarioId: string;
  titulo: string | null;
  creadoEn: Date;
  actualizadoEn: Date;
}

export interface MensajeChat {
  id: string;
  conversacionId: string;
  rol: "user" | "bot";
  contenido: string;
  creadoEn: Date;
}

export interface ConversacionConMensajes extends Conversacion {
  mensajes: MensajeChat[];
}
