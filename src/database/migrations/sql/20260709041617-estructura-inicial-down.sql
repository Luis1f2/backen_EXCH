-- Reversión de la migración inicial: elimina todas las tablas

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `usuario_interes`;
DROP TABLE IF EXISTS `usuario`;
DROP TABLE IF EXISTS `ubicacion`;
DROP TABLE IF EXISTS `tipo_usuario`;
DROP TABLE IF EXISTS `tipo_negocio`;
DROP TABLE IF EXISTS `tipo_entidad_resena`;
DROP TABLE IF EXISTS `tipo_entidad_alerta`;
DROP TABLE IF EXISTS `tipo_alerta`;
DROP TABLE IF EXISTS `ruta_destino`;
DROP TABLE IF EXISTS `ruta`;
DROP TABLE IF EXISTS `resena_ubicacion`;
DROP TABLE IF EXISTS `resena_negocio`;
DROP TABLE IF EXISTS `resena_destino`;
DROP TABLE IF EXISTS `promocion`;
DROP TABLE IF EXISTS `origen_ubicacion`;
DROP TABLE IF EXISTS `negocio_turistico`;
DROP TABLE IF EXISTS `negocio_servicio`;
DROP TABLE IF EXISTS `negocio_metrica`;
DROP TABLE IF EXISTS `negocio_horario`;
DROP TABLE IF EXISTS `negocio_administrador`;
DROP TABLE IF EXISTS `fotografia_resena`;
DROP TABLE IF EXISTS `favorito_negocio`;
DROP TABLE IF EXISTS `favorito_destino`;
DROP TABLE IF EXISTS `evento`;
DROP TABLE IF EXISTS `estado_revision`;
DROP TABLE IF EXISTS `estado_alerta`;
DROP TABLE IF EXISTS `destino_metrica`;
DROP TABLE IF EXISTS `destino`;
DROP TABLE IF EXISTS `categoria`;
DROP TABLE IF EXISTS `ambito_alerta`;
DROP TABLE IF EXISTS `alerta`;

SET FOREIGN_KEY_CHECKS = 1;