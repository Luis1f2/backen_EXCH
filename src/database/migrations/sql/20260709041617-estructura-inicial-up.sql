-- Migración inicial: estructura completa de la base de datos explora_chiapas
-- Generado a partir de explora_chiapas_backup.sql

SET FOREIGN_KEY_CHECKS = 0;

-- Tabla: alerta
CREATE TABLE `alerta` (
  `id` char(36) NOT NULL,
  `tipo_id` char(36) NOT NULL,
  `descripcion` text NOT NULL,
  `estado_id` char(36) NOT NULL,
  `ambito_id` char(36) NOT NULL,
  `entidad_tipo_id` char(36) DEFAULT NULL,
  `entidad_id` char(36) DEFAULT NULL,
  `fecha_generada` datetime NOT NULL DEFAULT current_timestamp(),
  `usuario_atendio_id` char(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_alerta_estado_id` (`estado_id`),
  KEY `idx_alerta_ambito_id` (`ambito_id`),
  KEY `idx_alerta_tipo_id` (`tipo_id`),
  KEY `idx_alerta_entidad` (`entidad_tipo_id`,`entidad_id`),
  KEY `idx_alerta_usuario_atendio_id` (`usuario_atendio_id`),
  CONSTRAINT `fk_alerta_ambito` FOREIGN KEY (`ambito_id`) REFERENCES `ambito_alerta` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_alerta_estado` FOREIGN KEY (`estado_id`) REFERENCES `estado_alerta` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_alerta_tipo` FOREIGN KEY (`tipo_id`) REFERENCES `tipo_alerta` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_alerta_tipo_entidad` FOREIGN KEY (`entidad_tipo_id`) REFERENCES `tipo_entidad_alerta` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_alerta_usuario_atendio` FOREIGN KEY (`usuario_atendio_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: ambito_alerta
CREATE TABLE `ambito_alerta` (
  `id` char(36) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ambito_alerta_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: categoria
CREATE TABLE `categoria` (
  `id` char(36) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `icono` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_categoria_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: destino
CREATE TABLE `destino` (
  `id` char(36) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `categoria_id` char(36) NOT NULL,
  `ubicacion_id` char(36) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `es_sostenible` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_destino_categoria_id` (`categoria_id`),
  KEY `idx_destino_ubicacion_id` (`ubicacion_id`),
  CONSTRAINT `fk_destino_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categoria` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_destino_ubicacion` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicacion` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: destino_metrica
CREATE TABLE `destino_metrica` (
  `destino_id` char(36) NOT NULL,
  `calificacion_promedio` decimal(3,2) NOT NULL DEFAULT 0.00,
  `total_resenas` int(11) NOT NULL DEFAULT 0,
  `afluencia` int(11) NOT NULL DEFAULT 0,
  `es_destino_saturado` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`destino_id`),
  CONSTRAINT `fk_destino_metrica_destino` FOREIGN KEY (`destino_id`) REFERENCES `destino` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_destino_metrica_calificacion` CHECK (`calificacion_promedio` between 0.00 and 5.00),
  CONSTRAINT `chk_destino_metrica_total_resenas` CHECK (`total_resenas` >= 0),
  CONSTRAINT `chk_destino_metrica_afluencia` CHECK (`afluencia` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: estado_alerta
CREATE TABLE `estado_alerta` (
  `id` char(36) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_estado_alerta_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: estado_revision
CREATE TABLE `estado_revision` (
  `id` char(36) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_estado_revision_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: evento
CREATE TABLE `evento` (
  `id` char(36) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `ubicacion_id` char(36) DEFAULT NULL,
  `categoria_id` char(36) DEFAULT NULL,
  `creado_por` char(36) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_evento_ubicacion_id` (`ubicacion_id`),
  KEY `idx_evento_categoria_id` (`categoria_id`),
  KEY `idx_evento_creado_por` (`creado_por`),
  KEY `idx_evento_fecha_inicio` (`fecha_inicio`),
  CONSTRAINT `fk_evento_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categoria` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_evento_ubicacion` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicacion` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_evento_usuario_creador` FOREIGN KEY (`creado_por`) REFERENCES `usuario` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: favorito_destino
CREATE TABLE `favorito_destino` (
  `usuario_id` char(36) NOT NULL,
  `destino_id` char(36) NOT NULL,
  `fecha_agregado` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`usuario_id`,`destino_id`),
  KEY `idx_favorito_destino_destino_id` (`destino_id`),
  CONSTRAINT `fk_favorito_destino_destino` FOREIGN KEY (`destino_id`) REFERENCES `destino` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_favorito_destino_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: favorito_negocio
CREATE TABLE `favorito_negocio` (
  `usuario_id` char(36) NOT NULL,
  `negocio_id` char(36) NOT NULL,
  `fecha_agregado` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`usuario_id`,`negocio_id`),
  KEY `idx_favorito_negocio_negocio_id` (`negocio_id`),
  CONSTRAINT `fk_favorito_negocio_negocio` FOREIGN KEY (`negocio_id`) REFERENCES `negocio_turistico` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_favorito_negocio_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: fotografia_resena
CREATE TABLE `fotografia_resena` (
  `id` char(36) NOT NULL,
  `resena_tipo_id` char(36) NOT NULL,
  `resena_id` char(36) NOT NULL,
  `usuario_id` char(36) DEFAULT NULL,
  `url_imagen` varchar(255) NOT NULL,
  `fecha_subida` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_fotografia_resena_tipo_resena` (`resena_tipo_id`,`resena_id`),
  KEY `idx_fotografia_resena_usuario_id` (`usuario_id`),
  CONSTRAINT `fk_fotografia_resena_tipo` FOREIGN KEY (`resena_tipo_id`) REFERENCES `tipo_entidad_resena` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_fotografia_resena_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: negocio_administrador
CREATE TABLE `negocio_administrador` (
  `id` char(36) NOT NULL,
  `usuario_id` char(36) NOT NULL,
  `negocio_id` char(36) NOT NULL,
  `rol` varchar(50) NOT NULL DEFAULT 'propietario',
  `estado_solicitud` varchar(50) NOT NULL DEFAULT 'pendiente',
  `fecha_asignacion` datetime NOT NULL DEFAULT current_timestamp(),
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_negocio_administrador_usuario_negocio` (`usuario_id`,`negocio_id`),
  KEY `idx_negocio_administrador_negocio_id` (`negocio_id`),
  CONSTRAINT `fk_negocio_administrador_negocio` FOREIGN KEY (`negocio_id`) REFERENCES `negocio_turistico` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_negocio_administrador_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: negocio_horario
CREATE TABLE `negocio_horario` (
  `id` char(36) NOT NULL,
  `negocio_id` char(36) NOT NULL,
  `dia_semana` tinyint(3) unsigned NOT NULL,
  `hora_apertura` time DEFAULT NULL,
  `hora_cierre` time DEFAULT NULL,
  `cerrado` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_negocio_horario_dia` (`negocio_id`,`dia_semana`),
  KEY `idx_negocio_horario_negocio_id` (`negocio_id`),
  CONSTRAINT `fk_negocio_horario_negocio` FOREIGN KEY (`negocio_id`) REFERENCES `negocio_turistico` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_negocio_horario_dia` CHECK (`dia_semana` between 1 and 7)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: negocio_metrica
CREATE TABLE `negocio_metrica` (
  `negocio_id` char(36) NOT NULL,
  `calificacion_promedio` decimal(3,2) NOT NULL DEFAULT 0.00,
  `total_resenas` int(11) NOT NULL DEFAULT 0,
  `total_favoritos` int(11) NOT NULL DEFAULT 0,
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`negocio_id`),
  CONSTRAINT `fk_negocio_metrica_negocio` FOREIGN KEY (`negocio_id`) REFERENCES `negocio_turistico` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_negocio_metrica_calificacion` CHECK (`calificacion_promedio` between 0.00 and 5.00),
  CONSTRAINT `chk_negocio_metrica_total_resenas` CHECK (`total_resenas` >= 0),
  CONSTRAINT `chk_negocio_metrica_total_favoritos` CHECK (`total_favoritos` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: negocio_servicio
CREATE TABLE `negocio_servicio` (
  `id` char(36) NOT NULL,
  `negocio_id` char(36) NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `precio_adicional` decimal(10,2) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_negocio_servicio_negocio_id` (`negocio_id`),
  KEY `idx_negocio_servicio_activo` (`activo`),
  CONSTRAINT `fk_negocio_servicio_negocio` FOREIGN KEY (`negocio_id`) REFERENCES `negocio_turistico` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_negocio_servicio_precio` CHECK (`precio_adicional` is null or `precio_adicional` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: negocio_turistico
CREATE TABLE `negocio_turistico` (
  `id` char(36) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo_negocio_id` char(36) NOT NULL,
  `ubicacion_id` char(36) NOT NULL,
  `precio_desde` decimal(10,2) DEFAULT NULL,
  `imagen_url` varchar(255) DEFAULT NULL,
  `esta_verificado` tinyint(1) NOT NULL DEFAULT 0,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_negocio_turistico_tipo_negocio_id` (`tipo_negocio_id`),
  KEY `idx_negocio_turistico_ubicacion_id` (`ubicacion_id`),
  CONSTRAINT `fk_negocio_turistico_tipo_negocio` FOREIGN KEY (`tipo_negocio_id`) REFERENCES `tipo_negocio` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_negocio_turistico_ubicacion` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicacion` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `chk_negocio_turistico_precio` CHECK (`precio_desde` is null or `precio_desde` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: origen_ubicacion
CREATE TABLE `origen_ubicacion` (
  `id` char(36) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_origen_ubicacion_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: promocion
CREATE TABLE `promocion` (
  `id` char(36) NOT NULL,
  `titulo` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) DEFAULT NULL,
  `negocio_id` char(36) NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date DEFAULT NULL,
  `creado_por` char(36) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_promocion_negocio_id` (`negocio_id`),
  KEY `idx_promocion_creado_por` (`creado_por`),
  KEY `idx_promocion_fecha_inicio` (`fecha_inicio`),
  CONSTRAINT `fk_promocion_negocio` FOREIGN KEY (`negocio_id`) REFERENCES `negocio_turistico` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_promocion_usuario_creador` FOREIGN KEY (`creado_por`) REFERENCES `usuario` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `chk_promocion_precio` CHECK (`precio` is null or `precio` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: resena_destino
CREATE TABLE `resena_destino` (
  `id` char(36) NOT NULL,
  `usuario_id` char(36) NOT NULL,
  `destino_id` char(36) NOT NULL,
  `calificacion` int(11) NOT NULL,
  `comentario` text DEFAULT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_resena_destino_usuario_destino` (`usuario_id`,`destino_id`),
  KEY `idx_resena_destino_destino_id` (`destino_id`),
  CONSTRAINT `fk_resena_destino_destino` FOREIGN KEY (`destino_id`) REFERENCES `destino` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_resena_destino_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_resena_destino_calificacion` CHECK (`calificacion` between 1 and 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: resena_negocio
CREATE TABLE `resena_negocio` (
  `id` char(36) NOT NULL,
  `usuario_id` char(36) NOT NULL,
  `negocio_id` char(36) NOT NULL,
  `calificacion` int(11) NOT NULL,
  `comentario` text DEFAULT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_resena_negocio_usuario_negocio` (`usuario_id`,`negocio_id`),
  KEY `idx_resena_negocio_negocio_id` (`negocio_id`),
  CONSTRAINT `fk_resena_negocio_negocio` FOREIGN KEY (`negocio_id`) REFERENCES `negocio_turistico` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_resena_negocio_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_resena_negocio_calificacion` CHECK (`calificacion` between 1 and 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: resena_ubicacion
CREATE TABLE `resena_ubicacion` (
  `id` char(36) NOT NULL,
  `usuario_id` char(36) NOT NULL,
  `ubicacion_id` char(36) NOT NULL,
  `calificacion` int(11) NOT NULL,
  `comentario` text DEFAULT NULL,
  `fecha` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_resena_ubicacion_usuario_ubicacion` (`usuario_id`,`ubicacion_id`),
  KEY `idx_resena_ubicacion_ubicacion_id` (`ubicacion_id`),
  CONSTRAINT `fk_resena_ubicacion_ubicacion` FOREIGN KEY (`ubicacion_id`) REFERENCES `ubicacion` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_resena_ubicacion_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_resena_ubicacion_calificacion` CHECK (`calificacion` between 1 and 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: ruta
CREATE TABLE `ruta` (
  `id` char(36) NOT NULL,
  `usuario_id` char(36) DEFAULT NULL,
  `nombre` varchar(150) NOT NULL,
  `presupuesto` decimal(10,2) DEFAULT NULL,
  `duracion_dias` int(11) DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `es_personalizada` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_ruta_usuario_id` (`usuario_id`),
  CONSTRAINT `fk_ruta_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_ruta_presupuesto` CHECK (`presupuesto` is null or `presupuesto` >= 0),
  CONSTRAINT `chk_ruta_duracion_dias` CHECK (`duracion_dias` is null or `duracion_dias` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: ruta_destino
CREATE TABLE `ruta_destino` (
  `ruta_id` char(36) NOT NULL,
  `destino_id` char(36) NOT NULL,
  `orden_visita` int(11) NOT NULL,
  `dia_visita` int(11) NOT NULL,
  PRIMARY KEY (`ruta_id`,`destino_id`),
  UNIQUE KEY `uq_ruta_destino_orden` (`ruta_id`,`orden_visita`),
  KEY `idx_ruta_destino_destino_id` (`destino_id`),
  CONSTRAINT `fk_ruta_destino_destino` FOREIGN KEY (`destino_id`) REFERENCES `destino` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ruta_destino_ruta` FOREIGN KEY (`ruta_id`) REFERENCES `ruta` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chk_ruta_destino_orden_visita` CHECK (`orden_visita` > 0),
  CONSTRAINT `chk_ruta_destino_dia_visita` CHECK (`dia_visita` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: tipo_alerta
CREATE TABLE `tipo_alerta` (
  `id` char(36) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tipo_alerta_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: tipo_entidad_alerta
CREATE TABLE `tipo_entidad_alerta` (
  `id` char(36) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tipo_entidad_alerta_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: tipo_entidad_resena
CREATE TABLE `tipo_entidad_resena` (
  `id` char(36) NOT NULL,
  `nombre` varchar(30) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tipo_entidad_resena_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: tipo_negocio
CREATE TABLE `tipo_negocio` (
  `id` char(36) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tipo_negocio_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: tipo_usuario
CREATE TABLE `tipo_usuario` (
  `id` char(36) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tipo_usuario_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: ubicacion
CREATE TABLE `ubicacion` (
  `id` char(36) NOT NULL,
  `latitud` decimal(10,8) NOT NULL,
  `longitud` decimal(11,8) NOT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `municipio` varchar(100) DEFAULT NULL,
  `estado` varchar(100) DEFAULT NULL,
  `origen_id` char(36) DEFAULT NULL,
  `proveedor_mapa` varchar(50) DEFAULT NULL,
  `proveedor_place_id` varchar(255) DEFAULT NULL,
  `creado_por_usuario_id` char(36) DEFAULT NULL,
  `estado_revision_id` char(36) DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_ubicacion_origen_id` (`origen_id`),
  KEY `idx_ubicacion_creado_por_usuario_id` (`creado_por_usuario_id`),
  KEY `idx_ubicacion_estado_revision_id` (`estado_revision_id`),
  KEY `idx_ubicacion_latitud_longitud` (`latitud`,`longitud`),
  CONSTRAINT `fk_ubicacion_estado_revision` FOREIGN KEY (`estado_revision_id`) REFERENCES `estado_revision` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ubicacion_origen` FOREIGN KEY (`origen_id`) REFERENCES `origen_ubicacion` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_ubicacion_usuario_creador` FOREIGN KEY (`creado_por_usuario_id`) REFERENCES `usuario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: usuario
CREATE TABLE `usuario` (
  `id` char(36) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `tipo_usuario_id` char(36) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp(),
  `es_premium` tinyint(1) NOT NULL DEFAULT 0,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuario_email` (`email`),
  KEY `idx_usuario_tipo_usuario_id` (`tipo_usuario_id`),
  CONSTRAINT `fk_usuario_tipo_usuario` FOREIGN KEY (`tipo_usuario_id`) REFERENCES `tipo_usuario` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: usuario_interes
CREATE TABLE `usuario_interes` (
  `usuario_id` char(36) NOT NULL,
  `categoria_id` char(36) NOT NULL,
  PRIMARY KEY (`usuario_id`,`categoria_id`),
  KEY `idx_usuario_interes_categoria_id` (`categoria_id`),
  CONSTRAINT `fk_usuario_interes_categoria` FOREIGN KEY (`categoria_id`) REFERENCES `categoria` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_usuario_interes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;