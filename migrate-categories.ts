import mysql from 'mysql2/promise';

async function migrateCategories() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_siplakra'
  });

  try {
    console.log('Migrating categories...');

    // 1. Create categories table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Insert default categories
    const defaultCategories = [
      { id: 'futsal', name: 'Futsal' },
      { id: 'basket', name: 'Basket' },
      { id: 'badminton', name: 'Badminton' },
      { id: 'padel', name: 'Padel' }
    ];

    for (const cat of defaultCategories) {
      await connection.query('INSERT IGNORE INTO categories (id, name) VALUES (?, ?)', [cat.id, cat.name]);
    }
    console.log('Categories table created and seeded.');

    // 3. Alter existing tables to use VARCHAR instead of ENUM
    console.log('Altering courts table...');
    await connection.query('ALTER TABLE courts MODIFY category VARCHAR(50) NOT NULL;');
    
    console.log('Altering equipments table...');
    await connection.query('ALTER TABLE equipments MODIFY category VARCHAR(50) NOT NULL;');

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await connection.end();
  }
}

migrateCategories();
