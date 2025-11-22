// Test database connection and configuration
require('dotenv').config();

console.log('========================================');
console.log('  Database Configuration Test');
console.log('========================================');
console.log('');

// Check environment variables
console.log('Environment Variables:');
console.log('  DB_TYPE:', process.env.DB_TYPE || '(not set)');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set');
console.log('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');
console.log('');

// Test database initialization
const Database = require('./database');

async function testDatabase() {
  console.log('Initializing database...');
  const db = new Database();
  
  // Wait a bit for async initialization
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('');
  console.log('Database Type:', db.type);
  console.log('');
  
  if (db.type === 'supabase') {
    console.log('✅ Using Supabase database');
    console.log('');
    console.log('Testing connection...');
    const connected = await db.testConnection();
    if (connected) {
      console.log('✅ Database connection successful!');
      console.log('');
      console.log('Testing write operation...');
      try {
        const testPC = 'TEST-PC-' + Date.now();
        await db.updatePCStatus(testPC, true, new Date().toISOString(), new Date().toISOString());
        console.log('✅ Write operation successful!');
        console.log('');
        console.log('Testing read operation...');
        const statuses = await db.getAllPCStatus();
        console.log(`✅ Read operation successful! Found ${statuses.length} PC(s) in database.`);
        console.log('');
        console.log('🎉 All tests passed! Database is working correctly.');
      } catch (error) {
        console.error('❌ Write/Read test failed:', error.message);
        console.error('Error details:', error);
      }
    } else {
      console.error('❌ Database connection failed!');
      console.error('   Check your Supabase credentials and network connection.');
    }
  } else if (db.type === 'memory') {
    console.warn('⚠️  Using in-memory storage');
    console.warn('   Data will NOT persist after server restart!');
    console.warn('');
    console.warn('To use Supabase:');
    console.warn('  1. Create a .env file in the server directory');
    console.warn('  2. Add: SUPABASE_URL=your_supabase_url');
    console.warn('  3. Add: SUPABASE_ANON_KEY=your_supabase_anon_key');
  } else {
    console.error('❌ Unknown database type:', db.type);
  }
  
  console.log('');
  process.exit(0);
}

testDatabase().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});


