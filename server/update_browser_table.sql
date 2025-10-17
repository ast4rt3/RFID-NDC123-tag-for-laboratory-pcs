-- Update browser_search_logs table to remove window_title column
-- Run this SQL script to update your existing database

-- First, let's see the current structure
DESCRIBE browser_search_logs;

-- Drop the old table and create a new one with the updated structure
DROP TABLE IF EXISTS `browser_search_logs`;

CREATE TABLE `browser_search_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pc_name` varchar(50) NOT NULL,
  `browser` varchar(50) NOT NULL,
  `url` text DEFAULT NULL,
  `search_query` text DEFAULT NULL,
  `search_engine` varchar(50) DEFAULT NULL,
  `timestamp` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_browser_search` (`pc_name`,`browser`,`url`,`timestamp`),
  KEY `idx_pc_name` (`pc_name`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_search_engine` (`search_engine`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Verify the new structure
DESCRIBE browser_search_logs;
