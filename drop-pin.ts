import { db } from './db';

async function dropPin() {
  try {
    console.log('Dropping pinCode column from users table...');
    await db.query(`ALTER TABLE users DROP COLUMN pinCode`);
    console.log('Column pinCode dropped successfully.');
  } catch (error: any) {
    console.log('Error dropping pinCode:', error.message);
  }
  process.exit(0);
}

dropPin();
