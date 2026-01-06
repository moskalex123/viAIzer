import pg from 'pg';
const { Client } = pg;

const client = new Client({
  user: 'taiger',
  host: '94.141.161.21',
  database: 'taigerdb',
  password: 'Pp969291',
  port: 5433,
});

async function testConnection() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Get all tables
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    const tablesResult = await client.query(tablesQuery);
    console.log('\n📋 Tables in database:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // For each table, get its structure
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      console.log(`\n📊 Table: ${tableName}`);
      
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position;
      `;
      const columnsResult = await client.query(columnsQuery, [tableName]);
      
      columnsResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
      });

      // Get row count
      const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
      const countResult = await client.query(countQuery);
      console.log(`  📈 Rows: ${countResult.rows[0].count}`);
    }

    // Sample data from key tables
    console.log('\n📝 Sample data from key tables:');
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      const sampleQuery = `SELECT * FROM ${tableName} LIMIT 3`;
      const sampleResult = await client.query(sampleQuery);
      
      if (sampleResult.rows.length > 0) {
        console.log(`\n  ${tableName} (${sampleResult.rows.length} sample rows):`);
        sampleResult.rows.forEach((dataRow, idx) => {
          console.log(`    Row ${idx + 1}:`, JSON.stringify(dataRow, null, 2));
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await client.end();
    console.log('\n🔌 Connection closed');
  }
}

testConnection();
