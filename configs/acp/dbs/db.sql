SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `table1`;
CREATE TABLE `table1` (
  `f1` int NOT NULL,
  `f2` int NOT NULL,
  `f3` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `table2`;
CREATE TABLE `table2` (
  `f1` int NOT NULL,
  `f2` int NOT NULL,
  `f3` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `table3`;
CREATE TABLE `table3` (
  `f1` int NOT NULL,
  `f2` int NOT NULL,
  `f3` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;