import mysql from 'mysql2/promise';

async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
  });

  try {
    console.log('Creating database db_siplakra...');
    await connection.query('CREATE DATABASE IF NOT EXISTS db_siplakra;');
    await connection.query('USE db_siplakra;');

    console.log('Creating tables...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        fullName VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        phone VARCHAR(25) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('customer', 'admin') DEFAULT 'customer',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS courts (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        image VARCHAR(255) NOT NULL,
        description TEXT,
        pricePerHour INT NOT NULL,
        status ENUM('available', 'maintenance') DEFAULT 'available'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS equipments (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        category VARCHAR(50) NOT NULL,
        price INT NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type ENUM('bank', 'qris') NOT NULL,
        accountName VARCHAR(100) NOT NULL,
        accountNumber VARCHAR(255) NOT NULL,
        isEnabled BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(50) PRIMARY KEY,
        userId VARCHAR(50) NOT NULL,
        userName VARCHAR(100) NOT NULL,
        userEmail VARCHAR(100) NOT NULL,
        userPhone VARCHAR(25) NOT NULL,
        courtId VARCHAR(50) NOT NULL,
        courtName VARCHAR(100) NOT NULL,
        date DATE NOT NULL,
        timeSlots JSON NOT NULL,
        duration INT NOT NULL,
        equipmentRental JSON,
        totalCost INT NOT NULL,
        dpPaid INT NOT NULL,
        status ENUM('pending_confirmation', 'approved', 'cancelled') DEFAULT 'pending_confirmation',
        paymentMethod ENUM('transfer_bank', 'qris') NOT NULL,
        paymentProof VARCHAR(255),
        fullPaymentProof VARCHAR(255),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (courtId) REFERENCES courts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    console.log('Seeding initial data...');
    
    // Seed Categories
    const [existingCategories]: any = await connection.query('SELECT id FROM categories');
    if (existingCategories.length === 0) {
      await connection.query(`
        INSERT INTO categories (id, name) VALUES
        ('futsal', 'Futsal'),
        ('basket', 'Basket'),
        ('badminton', 'Badminton'),
        ('padel', 'Padel')
      `);
      console.log('Categories seeded.');
    }

    // Seed Users
    const [existingUsers]: any = await connection.query('SELECT id FROM users');
    if (existingUsers.length === 0) {
      await connection.query(`
        INSERT INTO users (id, fullName, email, phone, password, role) VALUES 
        ('user-admin-1', 'Admin GOR The L3VEL', 'admin@l3vel.com', '089876543210', 'admin123', 'admin'),
        ('user-admin-dummy', 'Admin Dummy', 'admin@gmail.com', '081111111111', 'password', 'admin'),
        ('user-customer-1', 'Rizwan Mahendra', 'user@l3vel.com', '081234567890', 'user123', 'customer')
      `);
      console.log('Users seeded.');
    }

    // Seed Courts
    const [existingCourts]: any = await connection.query('SELECT id FROM courts');
    if (existingCourts.length === 0) {
      await connection.query(`
        INSERT INTO courts (id, name, category, image, description, pricePerHour, status) VALUES
        ('court-futsal-1', 'Standard Futsal Arena', 'futsal', 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&q=80&w=600', 'Lapangan futsal indoor bersertifikasi standar nasional dengan rumput sintetis berkualitas tinggi.', 150000, 'available'),
        ('court-futsal-2', 'Vinyl Futsal Court', 'futsal', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=600', 'Lapangan futsal beralas vinyl premium (interlock) yang aman bagi lutut.', 180000, 'available'),
        ('court-basket-1', 'Grand Basketball Stadium', 'basket', 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=600', 'Lapangan basket kelas profesional dengan lantai kayu jati.', 220000, 'available'),
        ('court-badminton-1', 'Badminton Court VIP A', 'badminton', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600', 'Lapangan bulu tangkis VIP dengan karpet vinyl terbaik anti licin.', 70000, 'available'),
        ('court-padel-1', 'Padel Glass Court Panoramic', 'padel', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80&w=600', 'Olahraga terpopuler kekinian! Lapangan padel kaca panoramic premium outdoor.', 250000, 'available')
      `);
      console.log('Courts seeded.');
    }

    // Seed Equipments
    const [existingEquipments]: any = await connection.query('SELECT id FROM equipments');
    if (existingEquipments.length === 0) {
      await connection.query(`
        INSERT INTO equipments (id, name, category, price) VALUES
        ('eq-futsal-ball', 'Bola Futsal Premium (Sewa)', 'futsal', 15000),
        ('eq-futsal-bibs', 'Rompi Tim (1 Set/10 Pcs)', 'futsal', 20000),
        ('eq-basket-ball', 'Bola Basket Molten GG7X', 'basket', 20000),
        ('eq-badminton-racket', 'Raket Yonex Astrox (Per Pcs)', 'badminton', 15000),
        ('eq-badminton-shuttlecock', 'Shuttlecock 1 Slop (12 Pcs/Beli)', 'all', 40000),
        ('eq-padel-racket', 'Padel Racket Adidas (Per Pcs)', 'padel', 30000),
        ('eq-padel-balls', 'Bola Padel (1 Slop / 3 Pcs)', 'padel', 25000),
        ('eq-shoes', 'Sepatu Olahraga All-Size', 'all', 25000)
      `);
      console.log('Equipments seeded.');
    }

    // Seed Payment Methods
    const [existingPayment]: any = await connection.query('SELECT id FROM payment_methods');
    if (existingPayment.length === 0) {
      await connection.query(`
        INSERT INTO payment_methods (type, accountName, accountNumber, isEnabled) VALUES
        ('bank', 'BCA - PT L3VEL Olahraga Sejahtera', '1234567890', true),
        ('qris', 'QRIS GOR L3VEL', '/qris-dummy.png', true)
      `);
      console.log('Payment Methods seeded.');
    }

    console.log('Database setup completed successfully! You can now run "npm run dev".');
  } catch (err) {
    console.error('Error setting up database:', err);
  } finally {
    await connection.end();
  }
}

setupDatabase();
