# SIPLAKRA (Sistem Informasi Reservasi Lapangan GOR)

Sistem Informasi Reservasi Lapangan terintegrasi standar modern, cepat, transparan, dan aman untuk GOR The L3VEL.

---

## 💡 Panduan Integrasi MySQL GOR L3VEL

Ikuti panduan langkah demi langkah di bawah ini untuk menghubungkan server backend Node/Express ini ke database MySQL Anda.

### 1. Buat Database & Skema Tabel Di MySQL

Aktifkan service database MySQL lokal Anda (misalnya melalui XAMPP, Laragon, Docker, atau MySQL Installer), masuk ke console MySQL/phpMyAdmin, lalu buat database baru bernama `db_siplakra`.

Jalankan perintah SQL (DDL) berikut untuk menginisialisasi skema tabel:

```sql
-- 1. Buat Database
CREATE DATABASE IF NOT EXISTS db_siplakra;
USE db_siplakra;

-- 2. Tabel Pengguna (Lengkap dengan PIN Keamanan)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  fullName VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  phone VARCHAR(25) NOT NULL,
  password VARCHAR(255) NOT NULL,
  pinCode VARCHAR(10) NOT NULL,
  role ENUM('customer', 'admin') DEFAULT 'customer',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel Lapangan GOR
CREATE TABLE IF NOT EXISTS courts (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category ENUM('futsal', 'basket', 'badminton', 'padel') NOT NULL,
  image VARCHAR(255) NOT NULL,
  description TEXT,
  pricePerHour INT NOT NULL,
  status ENUM('available', 'maintenance') DEFAULT 'available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabel Reservasi Lapangan
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(50) PRIMARY KEY,
  userId VARCHAR(50) NOT NULL,
  userName VARCHAR(100) NOT NULL,
  userEmail VARCHAR(100) NOT NULL,
  userPhone VARCHAR(25) NOT NULL,
  courtId VARCHAR(50) NOT NULL,
  courtName VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  timeSlots JSON NOT NULL, -- Menyimpan Jam e.g. [16, 17]
  duration INT NOT NULL,
  equipmentRental JSON, -- Menyimpan daftar peralatan tambahan
  totalCost INT NOT NULL,
  dpPaid INT NOT NULL,
  status ENUM('pending_confirmation', 'approved', 'cancelled') DEFAULT 'pending_confirmation',
  paymentMethod ENUM('transfer_bank', 'qris') NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (courtId) REFERENCES courts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2. Pasang Driver MySQL

Buka command terminal dalam folder project ini, lalu instal package `mysql2` untuk mengaktifkan koneksi dari Express ke MySQL:

```bash
npm install mysql2
```

### 3. Buat Berkas Konfigurasi Koneksi (`src/db.ts`)

Buat file baru bernama `src/db.ts` di folder backend Anda untuk inisialisasi koneksi MySQL Pool. Sesuaikan dengan credential database Anda:

```typescript
import mysql from 'mysql2/promise';

// Buat connection pool ke MySQL Lokal Anda
export const db = mysql.createPool({
  host: 'localhost',
  user: 'root', // Ganti dengan user MySQL Anda (default xampp biasanya root)
  password: '', // Ganti dengan password MySQL Anda
  database: 'db_siplakra',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

### 4. Hubungkan API Endpoint Server ke Database

Ganti logika variabel list in-memory (`users`, `bookings`, `courts`) di file backend `server.ts` dengan pemanggilan query asinkronus ke server MySQL.

Berikut adalah representasi contoh perubahan kode router register & login ke query SQL:

```typescript
import { db } from './src/db';

// CONTOH RE-CODE ENDPOINT REGISTER DENGAN MYSQL LOKAL
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, pinCode, role } = req.body;
    
    // 1. Cek duplikasi email
    const [rows]: any = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(400).json({ error: 'Email ini sudah terdaftar' });
    }

    const userId = `user-${Date.now()}`;
    const userRole = role === 'admin' ? 'admin' : 'customer';

    // 2. Jalankan simpan ke tabel MySQL
    await db.query(
      'INSERT INTO users (id, fullName, email, phone, password, pinCode, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, fullName, email, phone, password, pinCode, userRole]
    );

    res.status(201).json({ 
      user: { id: userId, fullName, email, phone, role: userRole, pinCode } 
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Sistem error: ' + error.message });
  }
});

// CONTOH RE-CODE ENDPOINT GET BOOKINGS DENGAN MYSQL LOKAL
app.get('/api/bookings', async (req, res) => {
  try {
    const [rows]: any = await db.query('SELECT * FROM bookings');
    // Konversi JSON array dari mysql karena disimpan dalam bentuk text string
    const parsedBookings = rows.map((b: any) => ({
      ...b,
      timeSlots: typeof b.timeSlots === 'string' ? JSON.parse(b.timeSlots) : b.timeSlots,
      equipmentRental: typeof b.equipmentRental === 'string' ? JSON.parse(b.equipmentRental) : b.equipmentRental
    }));
    res.json(parsedBookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```
