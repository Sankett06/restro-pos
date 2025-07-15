const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');

async function runMigrations() {
  try {
    console.log('🔄 Starting database migrations...');

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await pool.execute(statement);
      }
    }

    console.log('✅ Schema migration completed');

    // Read and execute seed.sql
    const seedPath = path.join(__dirname, 'seed.sql');
    if (fs.existsSync(seedPath)) {
      const seedSQL = fs.readFileSync(seedPath, 'utf8');
      const seedStatements = seedSQL.split(';').filter(stmt => stmt.trim());
      
      for (const statement of seedStatements) {
        if (statement.trim()) {
          await pool.execute(statement);
        }
      }
      
      console.log('✅ Seed data migration completed');
    }

    console.log('🎉 All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();