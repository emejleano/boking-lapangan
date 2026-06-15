# Panduan Integrasi MySQL GOR The L3VEL (SIPLAKRA)

Dokumen ini berisi panduan teknis langkah demi langkah untuk menghubungkan sistem informasi reservasi lapangan **SIPLAKRA GOR The L3VEL** berbasis Node.js Express + React ini ke database **MySQL lokal** di perangkat komputer Anda.

---

## 1. Persiapan Database MySQL Lokal
Nyalakan server database MySQL Anda (misal menggunakan XAMPP, Laragon, Docker, atau MySQL Community Server).
Masuk ke mysql client Anda (seperti phpMyAdmin, DBeaver, HeidiSQL, atau SQL CLI) lalu ikuti perintah berikut:

### Buat Database Baru
```sql
CREATE DATABASE IF NOT EXISTS db_siplakra;
USE db_siplakra;
```

### Jalankan Skema Tabel (DDL)
Jalankan instruksi pembuatan tabel di bawah secara berurutan:

```sql
-- 1. Tabel users (Dilengkapi dengan kode PIN Keamanan pelapis akun)
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

-- 2. Tabel courts (Katalog Lapangan)
CREATE TABLE IF NOT EXISTS courts (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category ENUM('futsal', 'basket', 'badminton', 'padel') NOT NULL,
  image VARCHAR(255) NOT NULL,
  description TEXT,
  pricePerHour INT NOT NULL,
  status ENUM('available', 'maintenance') DEFAULT 'available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabel bookings (Histori Transaksi Reservasi)
CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(50) PRIMARY KEY,
  userId VARCHAR(50) NOT NULL,
  userName VARCHAR(100) NOT NULL,
  userEmail VARCHAR(100) NOT NULL,
  userPhone VARCHAR(25) NOT NULL,
  courtId VARCHAR(50) NOT NULL,
  courtName VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  timeSlots JSON NOT NULL,          -- Format JSON Array, contoh: [16, 17]
  duration INT NOT NULL,
  equipmentRental JSON,             -- Format JSON Object Array, contoh: [{"name": "Bola", "price": 15000, "quantity": 1}]
  totalCost INT NOT NULL,
  dpPaid INT NOT NULL,
  status ENUM('pending_confirmation', 'approved', 'cancelled') DEFAULT 'pending_confirmation',
  paymentMethod ENUM('transfer_bank', 'qris') NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (courtId) REFERENCES courts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

```sql
-- Masukkan data awal lapangan (Seed Data) ke tabel courts
INSERT INTO courts (id, name, category, image, description, pricePerHour, status) VALUES
('court-futsal-1', 'Standard Futsal Arena', 'futsal', 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&q=80&w=600', 'Lapangan futsal indoor bersertifikasi standar nasional dengan rumput sintetis berkualitas tinggi.', 150000, 'available'),
('court-futsal-2', 'Vinyl Futsal Court', 'futsal', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=600', 'Lapangan futsal beralas vinyl premium (interlock) yang aman bagi lutut.', 180000, 'available'),
('court-basket-1', 'Grand Basketball Stadium', 'basket', 'https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=600', 'Lapangan basket kelas profesional dengan lantai kayu jati.', 220000, 'available'),
('court-badminton-1', 'Badminton Court VIP A', 'badminton', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600', 'Lapangan bulu tangkis VIP dengan karpet vinyl terbaik anti licin.', 70000, 'available'),
('court-padel-1', 'Padel Glass Court Panoramic', 'padel', 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&q=80&w=600', 'Olahraga terpopuler kekinian! Lapangan padel kaca panoramic premium outdoor.', 250000, 'available');
```

---

## 2. Pemasangan Package Driver MySQL
Masuk ke direktori utama proyek di sisi backend, lalu jalankan perintah npm install:
```bash
npm install mysql2
```

---

## 3. Buat File Konfigurasi Koneksi (`db.ts`)
Buat berkas baru bernama `db.ts` di direktori server untuk menginisialisasi parameter koneksi database Anda:

```typescript
// db.ts
import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: 'localhost',      // alamat host database Anda
  user: 'root',           // nama user database Anda
  password: '',           // password database Anda (kosongkan jika bawaan XAMPP)
  database: 'db_siplakra', // nama database yang telah dibuat
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

---

## 4. Sesuaikan Endpoint API di `server.ts`
Ganti logic In-Memory Array di `server.ts` dengan query SQL asinkronus. Contoh konversi API:

### Contoh API Registrasi (`POST /api/auth/register`)
```typescript
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, pinCode, role } = req.body;
    
    // Cek duplikasi email
    const [rows]: any = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(400).json({ error: 'Email ini sudah terdaftar' });
    }

    const userId = `user-${Date.now()}`;
    const userRole = role === 'admin' ? 'admin' : 'customer';

    // Simpan ke MySQL
    await db.query(
      'INSERT INTO users (id, fullName, email, phone, password, pinCode, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, fullName, email, phone, password, pinCode, userRole]
    );

    res.status(201).json({ user: { id: userId, fullName, email, phone, role: userRole, pinCode } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

### Contoh API Ambil History Reservasi (`GET /api/bookings`)
```typescript
app.get('/api/bookings', async (req, res) => {
  try {
    const [rows]: any = await db.query('SELECT * FROM bookings');
    
    // Parsing kembali kolom JSON text ke format array/object di javascript
    const parsedData = rows.map((b: any) => ({
      ...b,
      timeSlots: typeof b.timeSlots === 'string' ? JSON.parse(b.timeSlots) : b.timeSlots,
      equipmentRental: typeof b.equipmentRental === 'string' ? JSON.parse(b.equipmentRental) : b.equipmentRental
    }));

    res.json(parsedData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 5. Menjalankan Aplikasi
Setelah konfigurasi selesai, jalankan terminal Anda secara lokal:
```bash
# Untuk menjalankan development mode (Vite + Express)
npm run dev

# Untuk build dan start mode production
npm run build
npm run start
```
Aplikasi Anda kini sudah resmi terintegrasi penuh ke database MySQL Lokal secara elegan dan handal!
