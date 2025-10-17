-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 04, 2025 at 07:47 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `juglone`
--

-- --------------------------------------------------------

--
-- Stand-in structure for view `app_daily_summary`
-- (See below for the actual view)
--
CREATE TABLE `app_daily_summary` (
`pc_name` varchar(50)
,`app_name` varchar(100)
,`day` date
,`session_count` bigint(21)
,`total_app_usage_seconds` decimal(32,0)
);

-- --------------------------------------------------------

--
-- Table structure for table `app_usage_logs`
--

CREATE TABLE `app_usage_logs` (
  `id` int(11) NOT NULL,
  `pc_name` varchar(50) NOT NULL,
  `app_name` varchar(100) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `duration_seconds` int(11) NOT NULL,
  `memory_usage_bytes` bigint(20) DEFAULT NULL,
  `cpu_percent` float DEFAULT NULL,
  `gpu_percent` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `app_usage_logs`
--

INSERT INTO `app_usage_logs` (`id`, `pc_name`, `app_name`, `start_time`, `end_time`, `duration_seconds`, `memory_usage_bytes`, `cpu_percent`, `gpu_percent`) VALUES
(59, 'DESKTOP-7MUAVV6', 'RFID NDC123 Client', '2025-07-30 01:58:32', '2025-07-30 01:58:41', 9, 188866560, 4.65, NULL);

-- --------------------------------------------------------

--
-- Stand-in structure for view `pc_session_resource_avg`
-- (See below for the actual view)
--
CREATE TABLE `pc_session_resource_avg` (
`pc_name` varchar(50)
,`session_start` datetime
,`session_end` datetime
,`session_duration` int(11)
,`avg_memory_usage_bytes` decimal(23,4)
,`avg_cpu_percent` double
,`avg_gpu_percent` double
);

-- --------------------------------------------------------

--
-- Stand-in structure for view `pc_session_resource_summary`
-- (See below for the actual view)
--
CREATE TABLE `pc_session_resource_summary` (
`pc_name` varchar(50)
,`session_start` datetime
,`session_end` datetime
,`session_duration` int(11)
,`total_memory_usage_bytes` decimal(41,0)
,`total_cpu_percent` double
,`total_gpu_percent` double
);

-- --------------------------------------------------------

--
-- Table structure for table `browser_search_logs`
--

CREATE TABLE `browser_search_logs` (
  `id` int(11) NOT NULL,
  `pc_name` varchar(50) NOT NULL,
  `browser` varchar(50) NOT NULL,
  `url` text DEFAULT NULL,
  `search_query` text DEFAULT NULL,
  `search_engine` varchar(50) DEFAULT NULL,
  `timestamp` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `time_logs`
--

CREATE TABLE `time_logs` (
  `id` int(11) NOT NULL,
  `pc_name` varchar(50) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `duration_seconds` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `time_logs`
--

INSERT INTO `time_logs` (`id`, `pc_name`, `start_time`, `end_time`, `duration_seconds`) VALUES
(50, 'DESKTOP-7MUAVV6', '2025-07-30 01:58:24', '2025-07-30 01:58:42', 18);

-- --------------------------------------------------------

--
-- Structure for view `app_daily_summary`
--
DROP TABLE IF EXISTS `app_daily_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `app_daily_summary`  AS SELECT `app_usage_logs`.`pc_name` AS `pc_name`, `app_usage_logs`.`app_name` AS `app_name`, cast(`app_usage_logs`.`start_time` as date) AS `day`, count(0) AS `session_count`, sum(`app_usage_logs`.`duration_seconds`) AS `total_app_usage_seconds` FROM `app_usage_logs` GROUP BY `app_usage_logs`.`pc_name`, `app_usage_logs`.`app_name`, cast(`app_usage_logs`.`start_time` as date) ;

-- --------------------------------------------------------

--
-- Structure for view `pc_session_resource_avg`
--
DROP TABLE IF EXISTS `pc_session_resource_avg`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `pc_session_resource_avg`  AS SELECT `t`.`pc_name` AS `pc_name`, `t`.`start_time` AS `session_start`, `t`.`end_time` AS `session_end`, `t`.`duration_seconds` AS `session_duration`, avg(`a`.`memory_usage_bytes`) AS `avg_memory_usage_bytes`, avg(`a`.`cpu_percent`) AS `avg_cpu_percent`, avg(`a`.`gpu_percent`) AS `avg_gpu_percent` FROM (`time_logs` `t` left join `app_usage_logs` `a` on(`t`.`pc_name` = `a`.`pc_name` and `a`.`start_time` between `t`.`start_time` and `t`.`end_time`)) GROUP BY `t`.`id` ORDER BY `t`.`pc_name` ASC, `t`.`start_time` DESC ;

-- --------------------------------------------------------

--
-- Structure for view `pc_session_resource_summary`
--
DROP TABLE IF EXISTS `pc_session_resource_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `pc_session_resource_summary`  AS SELECT `t`.`pc_name` AS `pc_name`, `t`.`start_time` AS `session_start`, `t`.`end_time` AS `session_end`, `t`.`duration_seconds` AS `session_duration`, sum(`a`.`memory_usage_bytes`) AS `total_memory_usage_bytes`, sum(`a`.`cpu_percent`) AS `total_cpu_percent`, sum(`a`.`gpu_percent`) AS `total_gpu_percent` FROM (`time_logs` `t` left join `app_usage_logs` `a` on(`t`.`pc_name` = `a`.`pc_name` and `a`.`start_time` between `t`.`start_time` and `t`.`end_time`)) GROUP BY `t`.`id` ORDER BY `t`.`pc_name` ASC, `t`.`start_time` DESC ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `app_usage_logs`
--
ALTER TABLE `app_usage_logs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_app_usage` (`pc_name`,`app_name`,`start_time`);

--
-- Indexes for table `browser_search_logs`
--
ALTER TABLE `browser_search_logs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_browser_search` (`pc_name`,`browser`,`url`,`timestamp`),
  ADD KEY `idx_pc_name` (`pc_name`),
  ADD KEY `idx_timestamp` (`timestamp`),
  ADD KEY `idx_search_engine` (`search_engine`);

--
-- Indexes for table `time_logs`
--
ALTER TABLE `time_logs`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `app_usage_logs`
--
ALTER TABLE `app_usage_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `browser_search_logs`
--
ALTER TABLE `browser_search_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `time_logs`
--
ALTER TABLE `time_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
