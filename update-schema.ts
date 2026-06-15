import { db } from './db';

async function updateSchema() {
  try {
    console.log('Adding fullPaymentProof to bookings table...');
    await db.query(`ALTER TABLE bookings ADD COLUMN fullPaymentProof VARCHAR(255)`);
    console.log('Column fullPaymentProof added.');
  } catch (error: any) {
    console.log('Column fullPaymentProof might already exist:', error.message);
  }

  try {
    console.log('Adding dummy admin user...');
    await db.query(`
      INSERT INTO users (id, fullName, email, phone, password, pinCode, role) 
      VALUES ('user-admin-dummy', 'Admin Dummy', 'admin@gmail.com', '081111111111', 'password', '000000', 'admin')
    `);
    console.log('Dummy admin user added.');
  } catch (error: any) {
    console.log('Dummy admin might already exist:', error.message);
  }

  console.log('Schema update complete.');
  process.exit(0);
}

updateSchema();
