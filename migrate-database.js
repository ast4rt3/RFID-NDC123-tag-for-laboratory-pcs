#!/usr/bin/env node

/**
 * Database Migration Script
 * Migrates data from local MySQL to cloud database
 */

const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Database configurations
const sourceConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'juglone',
  port: 3306
};

const targetConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: process.env.NODE_ENV !== 'local' ? { rejectUnauthorized: false } : undefined
};

console.log('🚀 Starting database migration...');
console.log(`📤 Source: ${sourceConfig.host}:${sourceConfig.port}/${sourceConfig.database}`);
console.log(`📥 Target: ${targetConfig.host}:${targetConfig.port}/${targetConfig.database}`);

// Create connections
const sourceDb = mysql.createConnection(sourceConfig);
const targetDb = mysql.createConnection(targetConfig);

// Test connections
sourceDb.connect((err) => {
  if (err) {
    console.error('❌ Source database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to source database');
});

targetDb.connect((err) => {
  if (err) {
    console.error('❌ Target database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to target database');
});

// Migration functions
async function migrateTable(tableName, query) {
  return new Promise((resolve, reject) => {
    console.log(`📊 Migrating table: ${tableName}`);
    
    sourceDb.query(query, (err, rows) => {
      if (err) {
        console.error(`❌ Error reading ${tableName}:`, err.message);
        reject(err);
        return;
      }
      
      if (rows.length === 0) {
        console.log(`ℹ️  No data in ${tableName}`);
        resolve();
        return;
      }
      
      // Get table structure to build INSERT query
      sourceDb.query(`DESCRIBE ${tableName}`, (err, structure) => {
        if (err) {
          console.error(`❌ Error getting structure for ${tableName}:`, err.message);
          reject(err);
          return;
        }
        
        const columns = structure.map(col => col.Field).join(', ');
        const placeholders = structure.map(() => '?').join(', ');
        const insertQuery = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
        
        // Insert data in batches
        let inserted = 0;
        const batchSize = 100;
        
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          
          batch.forEach(row => {
            const values = structure.map(col => row[col.Field]);
            targetDb.query(insertQuery, values, (err) => {
              if (err) {
                console.error(`❌ Error inserting into ${tableName}:`, err.message);
                return;
              }
              inserted++;
              
              if (inserted === rows.length) {
                console.log(`✅ Migrated ${inserted} rows to ${tableName}`);
                resolve();
              }
            });
          });
        }
      });
    });
  });
}

// Main migration process
async function migrate() {
  try {
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'db.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Creating tables in target database...');
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await new Promise((resolve, reject) => {
          targetDb.query(statement, (err) => {
            if (err) {
              console.error('❌ Schema error:', err.message);
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }
    }
    
    console.log('✅ Schema created successfully');
    
    // Migrate data
    await migrateTable('time_logs', 'SELECT * FROM time_logs');
    await migrateTable('app_usage_logs', 'SELECT * FROM app_usage_logs');
    await migrateTable('browser_search_logs', 'SELECT * FROM browser_search_logs');
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    sourceDb.end();
    targetDb.end();
    process.exit(0);
  }
}

// Run migration
migrate();
