-- Migración: historial de chat por usuario

CREATE TABLE IF NOT EXISTS conversacion (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    UUID          NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  titulo        VARCHAR(200)  DEFAULT NULL,
  creado_en     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversacion_usuario ON conversacion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_conversacion_actualizado ON conversacion(actualizado_en DESC);

CREATE TABLE IF NOT EXISTS mensaje_chat (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversacion_id  UUID        NOT NULL REFERENCES conversacion(id) ON DELETE CASCADE,
  rol              VARCHAR(10) NOT NULL CHECK (rol IN ('user', 'bot')),
  contenido        TEXT        NOT NULL,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensaje_conversacion ON mensaje_chat(conversacion_id, creado_en);
