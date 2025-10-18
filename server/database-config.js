// Database configuration for different environments
const config = {
  // Local development (current setup)
  local: {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'juglone',
    port: 3306
  },
  
  // AWS RDS MySQL
  aws: {
    host: process.env.DB_HOST || 'your-rds-endpoint.amazonaws.com',
    user: process.env.DB_USER || 'admin',
    password: process.env.DB_PASSWORD || 'your-secure-password',
    database: process.env.DB_NAME || 'juglone',
    port: process.env.DB_PORT || 3306,
    ssl: {
      rejectUnauthorized: false
    }
  },
  
  // Google Cloud SQL
  gcp: {
    host: process.env.DB_HOST || 'your-cloud-sql-ip',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'your-password',
    database: process.env.DB_NAME || 'juglone',
    port: process.env.DB_PORT || 3306,
    ssl: {
      rejectUnauthorized: false
    }
  },
  
  // PlanetScale (MySQL-compatible)
  planetscale: {
    host: process.env.DB_HOST || 'your-planetscale-host',
    user: process.env.DB_USER || 'your-username',
    password: process.env.DB_PASSWORD || 'your-password',
    database: process.env.DB_NAME || 'juglone',
    port: process.env.DB_PORT || 3306,
    ssl: {
      rejectUnauthorized: false
    }
  },
  
  // Supabase (PostgreSQL - requires schema changes)
  supabase: {
    host: process.env.DB_HOST || 'your-supabase-host',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'your-password',
    database: process.env.DB_NAME || 'postgres',
    port: process.env.DB_PORT || 5432,
    ssl: {
      rejectUnauthorized: false
    }
  }
};

// Get current environment
const environment = process.env.NODE_ENV || 'local';

// Export the appropriate config
module.exports = config[environment];
