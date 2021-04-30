-- MySQL dump 10.13  Distrib 8.0.18, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: queue
-- ------------------------------------------------------
-- Server version	8.0.18

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `queue`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `queue` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `queue`;

--
-- Table structure for table `item`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item` (
  `code` varchar(255) NOT NULL DEFAULT 'pending',
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fkey_queue_run_id` bigint(20) unsigned NOT NULL,
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `payload` json NOT NULL,
  PRIMARY KEY (`id`),
  KEY `item_fkey_queue_run_id_idx` (`fkey_queue_run_id`) USING BTREE,
  CONSTRAINT `item_queue_run_fkey` FOREIGN KEY (`fkey_queue_run_id`) REFERENCES `queue_run` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `queue`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `queue` (
  `database` varchar(255) DEFAULT NULL,
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fkey_queue_id` bigint(20) unsigned DEFAULT NULL,
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `query` text,
  `schedule` varchar(255) DEFAULT NULL,
  `schedule_begin` datetime DEFAULT NULL,
  `schedule_end` datetime DEFAULT NULL,
  `schedule_next` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `queue_fkey_queue_id_idx` (`fkey_queue_id`) USING BTREE,
  CONSTRAINT `queue_queue_fkey` FOREIGN KEY (`fkey_queue_id`) REFERENCES `queue` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `queue_run`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `queue_run` (
  `aggr_err` int(10) unsigned NOT NULL DEFAULT '0',
  `aggr_ok` int(10) unsigned NOT NULL DEFAULT '0',
  `aggr_total` int(10) unsigned NOT NULL DEFAULT '0',
  `code` varchar(255) NOT NULL DEFAULT 'pending',
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fkey_item_id` bigint(20) unsigned DEFAULT NULL,
  `fkey_queue_id` bigint(20) unsigned NOT NULL,
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `reason` text,
  PRIMARY KEY (`id`),
  KEY `queue_run_fkey_item_id_IDX` (`fkey_item_id`) USING BTREE,
  KEY `queue_run_fkey_queue_id_IDX` (`fkey_queue_id`) USING BTREE,
  CONSTRAINT `queue_run_item_fkey` FOREIGN KEY (`fkey_item_id`) REFERENCES `item` (`id`) ON DELETE SET NULL,
  CONSTRAINT `queue_run_queue_fkey` FOREIGN KEY (`fkey_queue_id`) REFERENCES `queue` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `task`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task` (
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fkey_queue_id` bigint(20) unsigned NOT NULL,
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'main',
  `number` int(11) NOT NULL DEFAULT '1',
  `options` json NOT NULL DEFAULT (json_object()),
  PRIMARY KEY (`id`),
  KEY `task_fkey_queue_id_idx` (`fkey_queue_id`) USING BTREE,
  CONSTRAINT `task_queue_fkey` FOREIGN KEY (`fkey_queue_id`) REFERENCES `queue` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `task_run`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_run` (
  `code` varchar(255) NOT NULL DEFAULT 'pending',
  `consumer` varchar(255) DEFAULT NULL,
  `date_created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `date_queued` datetime DEFAULT NULL,
  `date_started` datetime DEFAULT NULL,
  `date_updated` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fkey_item_id` bigint(20) unsigned NOT NULL,
  `fkey_queue_run_id` bigint(20) unsigned NOT NULL,
  `fkey_task_id` bigint(20) unsigned NOT NULL,
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `reason` text,
  `result` json NOT NULL DEFAULT (json_object()),
  `xid` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `task_run_fkey_item_id_idx` (`fkey_item_id`) USING BTREE,
  KEY `task_run_fkey_queue_run_id_IDX` (`fkey_queue_run_id`) USING BTREE,
  KEY `task_run_fkey_task_id_IDX` (`fkey_task_id`) USING BTREE,
  CONSTRAINT `task_run_item_fkey` FOREIGN KEY (`fkey_item_id`) REFERENCES `item` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_run_queue_run_fkey` FOREIGN KEY (`fkey_queue_run_id`) REFERENCES `queue_run` (`id`) ON DELETE CASCADE,
  CONSTRAINT `task_run_task_fkey` FOREIGN KEY (`fkey_task_id`) REFERENCES `task` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-04-30 10:31:16
