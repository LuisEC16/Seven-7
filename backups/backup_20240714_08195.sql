/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: administrador
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `administrador` (
  `ID_administrador` int(11) NOT NULL AUTO_INCREMENT,
  `Usuario` varchar(45) NOT NULL,
  `Contrasena` varchar(255) NOT NULL,
  PRIMARY KEY (`ID_administrador`)
) ENGINE = InnoDB AUTO_INCREMENT = 2 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: carrito_de_compras
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `carrito_de_compras` (
  `ID_carrito` int(11) NOT NULL AUTO_INCREMENT,
  `Fecha` date NOT NULL,
  `Usuario_ID` int(11) NOT NULL,
  PRIMARY KEY (`ID_carrito`),
  UNIQUE KEY `Usuario_ID` (`Usuario_ID`),
  CONSTRAINT `carrito_de_compras_ibfk_1` FOREIGN KEY (`Usuario_ID`) REFERENCES `usuarios` (`ID`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 23 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: carrito_productos
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `carrito_productos` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `ID_carrito` int(11) NOT NULL,
  `ID_Productos` int(11) NOT NULL,
  `Cantidad` int(11) NOT NULL,
  `Talla` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`ID`),
  KEY `ID_Productos` (`ID_Productos`),
  KEY `ID_carrito` (`ID_carrito`),
  CONSTRAINT `carrito_productos_ibfk_1` FOREIGN KEY (`ID_Productos`) REFERENCES `productos` (`ID_productos`) ON DELETE CASCADE,
  CONSTRAINT `carrito_productos_ibfk_2` FOREIGN KEY (`ID_carrito`) REFERENCES `carrito_de_compras` (`ID_carrito`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 53 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: comprobante
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `comprobante` (
  `ID_Comprobante` int(11) NOT NULL AUTO_INCREMENT,
  `Fecha` datetime NOT NULL,
  `Total` decimal(8, 2) NOT NULL,
  `Numero_Telefonico` varchar(11) DEFAULT NULL,
  `pago` enum('Efectivo $/€', 'Efectivo Bs', 'Pago Móvil') DEFAULT NULL,
  `entrega` enum(
  'Pick up',
  'Delivery',
  'Envio (fuera de Maracaibo)'
  ) DEFAULT NULL,
  `Usuario_ID` int(11) NOT NULL,
  `Estado` enum('Rechazada', 'En proceso', 'Finalizada') DEFAULT 'En proceso',
  PRIMARY KEY (`ID_Comprobante`),
  KEY `Usuario_ID` (`Usuario_ID`),
  CONSTRAINT `comprobante_ibfk_1` FOREIGN KEY (`Usuario_ID`) REFERENCES `usuarios` (`ID`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 9 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: historial_de_compras
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `historial_de_compras` (
  `ID_Historial_de_compras` int(11) NOT NULL AUTO_INCREMENT,
  `Fecha` date NOT NULL,
  `Total` decimal(8, 2) NOT NULL,
  `Usuario_ID` int(11) NOT NULL,
  `Comprobante_ID` int(11) NOT NULL,
  PRIMARY KEY (`ID_Historial_de_compras`),
  KEY `Usuario_ID` (`Usuario_ID`),
  KEY `Comprobante_ID` (`Comprobante_ID`),
  CONSTRAINT `historial_de_compras_ibfk_1` FOREIGN KEY (`Usuario_ID`) REFERENCES `usuarios` (`ID`) ON DELETE CASCADE,
  CONSTRAINT `historial_de_compras_ibfk_2` FOREIGN KEY (`Comprobante_ID`) REFERENCES `comprobante` (`ID_Comprobante`) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: producto_imagenes
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `producto_imagenes` (
  `ID_imagen` int(11) NOT NULL AUTO_INCREMENT,
  `ID_productos` int(11) NOT NULL,
  `Imagen` varchar(255) NOT NULL,
  PRIMARY KEY (`ID_imagen`),
  KEY `ID_productos` (`ID_productos`),
  CONSTRAINT `producto_imagenes_ibfk_1` FOREIGN KEY (`ID_productos`) REFERENCES `productos` (`ID_productos`) ON DELETE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 14 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: producto_tallas
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `producto_tallas` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `producto_ID` int(11) NOT NULL,
  `talla_ID` int(11) NOT NULL,
  `Stock` int(11) NOT NULL,
  PRIMARY KEY (`ID`),
  KEY `producto_ID` (`producto_ID`),
  KEY `talla_ID` (`talla_ID`),
  CONSTRAINT `producto_tallas_ibfk_1` FOREIGN KEY (`producto_ID`) REFERENCES `productos` (`ID_productos`),
  CONSTRAINT `producto_tallas_ibfk_2` FOREIGN KEY (`talla_ID`) REFERENCES `tallas` (`ID`)
) ENGINE = InnoDB AUTO_INCREMENT = 16 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: productos
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `productos` (
  `ID_productos` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(45) NOT NULL,
  `Descripcion` varchar(255) NOT NULL,
  `Precio` decimal(8, 2) NOT NULL,
  `Categoria` enum(
  'Prenda superior',
  'Prenda inferior',
  'Colecciones'
  ) DEFAULT NULL,
  `Descuento` decimal(5, 2) NOT NULL,
  PRIMARY KEY (`ID_productos`)
) ENGINE = InnoDB AUTO_INCREMENT = 14 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: sessions
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`session_id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: tallas
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `tallas` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Talla` enum('XS', 'S', 'M', 'L', 'XL') NOT NULL,
  PRIMARY KEY (`ID`)
) ENGINE = InnoDB AUTO_INCREMENT = 6 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# SCHEMA DUMP FOR TABLE: usuarios
# ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS `usuarios` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre_Apellido` varchar(45) NOT NULL,
  `Email` varchar(45) NOT NULL,
  `Contrasena` varchar(255) NOT NULL,
  `Direccion` varchar(45) NOT NULL,
  `Fecha` datetime NOT NULL,
  `resetPasswordToken` varchar(255) DEFAULT NULL,
  `resetPasswordExpires` datetime DEFAULT NULL,
  `validationToken` varchar(255) DEFAULT NULL,
  `validationTokenExpires` datetime DEFAULT NULL,
  PRIMARY KEY (`ID`),
  UNIQUE KEY `unique_email` (`Email`)
) ENGINE = InnoDB AUTO_INCREMENT = 26 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: administrador
# ------------------------------------------------------------

INSERT INTO
  `administrador` (`ID_administrador`, `Usuario`, `Contrasena`)
VALUES
  (1, 'Admin', 'admin');

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: carrito_de_compras
# ------------------------------------------------------------

INSERT INTO
  `carrito_de_compras` (`ID_carrito`, `Fecha`, `Usuario_ID`)
VALUES
  (11, '2024-07-07', 10);
INSERT INTO
  `carrito_de_compras` (`ID_carrito`, `Fecha`, `Usuario_ID`)
VALUES
  (13, '2024-07-09', 12);

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: carrito_productos
# ------------------------------------------------------------

INSERT INTO
  `carrito_productos` (
    `ID`,
    `ID_carrito`,
    `ID_Productos`,
    `Cantidad`,
    `Talla`
  )
VALUES
  (52, 13, 13, 1, 'S');

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: comprobante
# ------------------------------------------------------------

INSERT INTO
  `comprobante` (
    `ID_Comprobante`,
    `Fecha`,
    `Total`,
    `Numero_Telefonico`,
    `pago`,
    `entrega`,
    `Usuario_ID`,
    `Estado`
  )
VALUES
  (
    8,
    '2024-07-07 23:03:28',
    106.49,
    '04248417633',
    'Pago Móvil',
    'Envio (fuera de Maracaibo)',
    10,
    'En proceso'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: historial_de_compras
# ------------------------------------------------------------


# ------------------------------------------------------------
# DATA DUMP FOR TABLE: producto_imagenes
# ------------------------------------------------------------

INSERT INTO
  `producto_imagenes` (`ID_imagen`, `ID_productos`, `Imagen`)
VALUES
  (13, 13, 'imagen-1720908244498-613119267.jpg');

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: producto_tallas
# ------------------------------------------------------------

INSERT INTO
  `producto_tallas` (`ID`, `producto_ID`, `talla_ID`, `Stock`)
VALUES
  (11, 13, 1, 2);
INSERT INTO
  `producto_tallas` (`ID`, `producto_ID`, `talla_ID`, `Stock`)
VALUES
  (12, 13, 2, 10);
INSERT INTO
  `producto_tallas` (`ID`, `producto_ID`, `talla_ID`, `Stock`)
VALUES
  (13, 13, 3, 1);
INSERT INTO
  `producto_tallas` (`ID`, `producto_ID`, `talla_ID`, `Stock`)
VALUES
  (14, 13, 4, 0);
INSERT INTO
  `producto_tallas` (`ID`, `producto_ID`, `talla_ID`, `Stock`)
VALUES
  (15, 13, 5, 0);

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: productos
# ------------------------------------------------------------

INSERT INTO
  `productos` (
    `ID_productos`,
    `Nombre`,
    `Descripcion`,
    `Precio`,
    `Categoria`,
    `Descuento`
  )
VALUES
  (13, 'jeans', 'blue', 5.00, 'Prenda inferior', 5.00);

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: sessions
# ------------------------------------------------------------

INSERT INTO
  `sessions` (`session_id`, `expires`, `data`)
VALUES
  (
    '1-rV2G5RjfJPgsQ_0F1Ae8H6Ofc6XX_V',
    1720948796,
    '{\"cookie\":{\"originalMaxAge\":3600000,\"expires\":\"2024-07-14T09:19:55.624Z\",\"httpOnly\":true,\"path\":\"/\"},\"flash\":{},\"adminLoggedIn\":true}'
  );

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: tallas
# ------------------------------------------------------------

INSERT INTO
  `tallas` (`ID`, `Talla`)
VALUES
  (1, 'XS');
INSERT INTO
  `tallas` (`ID`, `Talla`)
VALUES
  (2, 'S');
INSERT INTO
  `tallas` (`ID`, `Talla`)
VALUES
  (3, 'M');
INSERT INTO
  `tallas` (`ID`, `Talla`)
VALUES
  (4, 'L');
INSERT INTO
  `tallas` (`ID`, `Talla`)
VALUES
  (5, 'XL');

# ------------------------------------------------------------
# DATA DUMP FOR TABLE: usuarios
# ------------------------------------------------------------

INSERT INTO
  `usuarios` (
    `ID`,
    `Nombre_Apellido`,
    `Email`,
    `Contrasena`,
    `Direccion`,
    `Fecha`,
    `resetPasswordToken`,
    `resetPasswordExpires`,
    `validationToken`,
    `validationTokenExpires`
  )
VALUES
  (
    10,
    'Gabriel Carrera',
    'Xpower@gmail.com',
    '12345.',
    'Caracas-La guaira',
    '2024-07-07 19:02:35',
    NULL,
    NULL,
    NULL,
    NULL
  );
INSERT INTO
  `usuarios` (
    `ID`,
    `Nombre_Apellido`,
    `Email`,
    `Contrasena`,
    `Direccion`,
    `Fecha`,
    `resetPasswordToken`,
    `resetPasswordExpires`,
    `validationToken`,
    `validationTokenExpires`
  )
VALUES
  (
    12,
    'Juan Nuñez',
    'juannunezapple12@hotmail.com',
    'juan.loco',
    'cantaclaro',
    '2024-07-09 21:06:54',
    NULL,
    NULL,
    NULL,
    NULL
  );
INSERT INTO
  `usuarios` (
    `ID`,
    `Nombre_Apellido`,
    `Email`,
    `Contrasena`,
    `Direccion`,
    `Fecha`,
    `resetPasswordToken`,
    `resetPasswordExpires`,
    `validationToken`,
    `validationTokenExpires`
  )
VALUES
  (
    25,
    'Luis Chacin',
    'l.enrique16@hotmail.com',
    'hola.123',
    'canta claro',
    '2024-07-11 21:36:59',
    NULL,
    NULL,
    NULL,
    NULL
  );

/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
