/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { Booking, Court, User, PaymentMethod } from './src/types';
import { db } from './db';

const app = express();
const PORT = 3000;

// Body Parsers
app.use(express.json());

// Setup Multer for file uploads
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// =========================================================================
// API ENDPOINTS (MYSQL IMPLEMENTATION)
// =========================================================================

// --- AUTH API ---

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, phone, password, role } = req.body;
    
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ error: 'Harap lengkapi semua data pendaftaran (Nama, Email, HP, Password)' });
    }

    const [rows]: any = await db.query('SELECT * FROM users WHERE email = ? OR phone = ?', [email, phone]);
    if (rows.length > 0) {
      if (rows.some((r: any) => r.email === email)) {
        return res.status(400).json({ error: 'Email ini sudah terdaftar' });
      }
      if (rows.some((r: any) => r.phone === phone)) {
        return res.status(400).json({ error: 'Nomor telepon sudah terdaftar' });
      }
    }

    const userId = `user-${Date.now()}`;
    const userRole = role === 'admin' ? 'admin' : 'customer';

    await db.query(
      'INSERT INTO users (id, fullName, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, fullName, email, phone, password, userRole]
    );

    res.status(201).json({ user: { id: userId, fullName, email, phone, role: userRole } });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password harus diisi' });
    }

    const [rows]: any = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    const user = rows[0];

    delete user.password; // Don't send password back
    res.json({ user });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- USERS API ---

app.get('/api/users', async (req, res) => {
  try {
    const [rows]: any = await db.query('SELECT id, fullName, email, phone, password, role, createdAt FROM users');
    res.json(rows);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { fullName, email, phone, password, role } = req.body;
    
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ error: 'Harap lengkapi semua data pengguna' });
    }

    const [rows]: any = await db.query('SELECT * FROM users WHERE email = ? OR phone = ?', [email, phone]);
    if (rows.length > 0) {
      if (rows.some((r: any) => r.email === email)) {
        return res.status(400).json({ error: 'Email ini sudah terdaftar' });
      }
      if (rows.some((r: any) => r.phone === phone)) {
        return res.status(400).json({ error: 'Nomor telepon sudah terdaftar' });
      }
    }

    const userId = `user-${Date.now()}`;
    const userRole = role === 'admin' ? 'admin' : 'customer';

    await db.query(
      'INSERT INTO users (id, fullName, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, fullName, email, phone, password, userRole]
    );

    res.status(201).json({ id: userId, fullName, email, phone, role: userRole });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, password, role } = req.body;

    const [userRows]: any = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    const [existing]: any = await db.query('SELECT * FROM users WHERE (email = ? OR phone = ?) AND id != ?', [email, phone, id]);
    if (existing.length > 0) {
      if (existing.some((r: any) => r.email === email)) {
        return res.status(400).json({ error: 'Email ini sudah terdaftar' });
      }
      if (existing.some((r: any) => r.phone === phone)) {
        return res.status(400).json({ error: 'Nomor telepon sudah terdaftar' });
      }
    }

    await db.query(
      'UPDATE users SET fullName = ?, email = ?, phone = ?, password = ?, role = ? WHERE id = ?',
      [fullName, email, phone, password, role || 'customer', id]
    );

    res.json({ id, fullName, email, phone, role });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- COURTS API ---

app.get('/api/courts', async (req, res) => {
  try {
    const [rows]: any = await db.query('SELECT * FROM courts');
    res.json(rows);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/courts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pricePerHour, status, description, name, image } = req.body;

    // Get current court to update partially
    const [rows]: any = await db.query('SELECT * FROM courts WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Lapangan tidak ditemukan' });
    }
    const current = rows[0];

    const updatedPrice = pricePerHour !== undefined ? Number(pricePerHour) : current.pricePerHour;
    const updatedStatus = status !== undefined ? status : current.status;
    const updatedDesc = description !== undefined ? description : current.description;
    const updatedName = name !== undefined ? name : current.name;
    const updatedImage = image !== undefined ? image : current.image;

    await db.query(
      'UPDATE courts SET pricePerHour = ?, status = ?, description = ?, name = ?, image = ? WHERE id = ?',
      [updatedPrice, updatedStatus, updatedDesc, updatedName, updatedImage, id]
    );

    res.json({ id, pricePerHour: updatedPrice, status: updatedStatus, description: updatedDesc, name: updatedName, image: updatedImage });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/courts', async (req, res) => {
  try {
    const { id, name, category, image, description, pricePerHour, status } = req.body;
    await db.query(
      'INSERT INTO courts (id, name, category, image, description, pricePerHour, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, category, image, description, pricePerHour, status || 'available']
    );
    res.status(201).json({ success: true, id });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/courts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM courts WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- CATEGORIES API ---

app.get('/api/categories', async (req, res) => {
  try {
    const [rows]: any = await db.query('SELECT * FROM categories');
    res.json(rows);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await db.query('INSERT INTO categories (id, name) VALUES (?, ?)', [id, name]);
    res.status(201).json({ id, name });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    await db.query('UPDATE categories SET name = ? WHERE id = ?', [name, id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- EQUIPMENTS API ---

app.get('/api/equipments', async (req, res) => {
  try {
    const [rows]: any = await db.query('SELECT * FROM equipments');
    res.json(rows);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/equipments', async (req, res) => {
  try {
    const { name, category, price } = req.body;
    const id = `eq-${category}-${Date.now()}`;
    await db.query(
      'INSERT INTO equipments (id, name, category, price) VALUES (?, ?, ?, ?)',
      [id, name, category, price]
    );
    res.status(201).json({ id, name, category, price });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/equipments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price } = req.body;
    
    await db.query(
      'UPDATE equipments SET name = ?, category = ?, price = ? WHERE id = ?',
      [name, category, price, id]
    );
    
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/equipments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM equipments WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- PAYMENT METHODS API ---

app.get('/api/payment-methods', async (req, res) => {
  try {
    const [rows]: any = await db.query('SELECT * FROM payment_methods');
    res.json(rows);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payment-methods', async (req, res) => {
  try {
    const { type, accountName, accountNumber, isEnabled } = req.body;
    await db.query(
      'INSERT INTO payment_methods (type, accountName, accountNumber, isEnabled) VALUES (?, ?, ?, ?)',
      [type, accountName, accountNumber, isEnabled !== undefined ? isEnabled : true]
    );
    res.status(201).json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/payment-methods/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { accountName, accountNumber, isEnabled } = req.body;
    
    // Simple update builder
    let query = 'UPDATE payment_methods SET ';
    const params: any[] = [];
    if (accountName !== undefined) { query += 'accountName = ?, '; params.push(accountName); }
    if (accountNumber !== undefined) { query += 'accountNumber = ?, '; params.push(accountNumber); }
    if (isEnabled !== undefined) { query += 'isEnabled = ?, '; params.push(isEnabled); }
    
    query = query.slice(0, -2) + ' WHERE id = ?';
    params.push(id);
    
    if(params.length > 1) {
      await db.query(query, params);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- UPLOAD API ---

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Tidak ada file yang diunggah' });
  }
  
  // Return the public URL for the uploaded file
  res.json({ url: `/uploads/${req.file.filename}` });
});


// --- BOOKINGS API ---

app.get('/api/bookings', async (req, res) => {
  try {
    const [rows]: any = await db.query('SELECT * FROM bookings ORDER BY createdAt DESC');
    
    // Parse JSON
    const parsedData = rows.map((b: any) => ({
      ...b,
      timeSlots: typeof b.timeSlots === 'string' ? JSON.parse(b.timeSlots) : b.timeSlots,
      equipmentRental: typeof b.equipmentRental === 'string' ? JSON.parse(b.equipmentRental) : b.equipmentRental
    }));

    res.json(parsedData);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/schedule/:courtId/:date', async (req, res) => {
  try {
    const { courtId, date } = req.params;
    
    const [rows]: any = await db.query(
      "SELECT timeSlots FROM bookings WHERE courtId = ? AND date = ? AND status != 'cancelled'",
      [courtId, date]
    );

    const bookedSlots = rows.reduce((acc: number[], b: any) => {
      const slots = typeof b.timeSlots === 'string' ? JSON.parse(b.timeSlots) : b.timeSlots;
      acc.push(...slots);
      return acc;
    }, []);

    res.json({ bookedSlots });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      userPhone,
      userName,
      courtId,
      courtName,
      date,
      timeSlots,
      equipmentRental,
      totalCost,
      dpPaid,
      paymentMethod,
      paymentProof,
    } = req.body;

    if (!userEmail || !userName || !courtId || !date || !timeSlots || timeSlots.length === 0) {
      return res.status(400).json({ error: 'Form pemesanan belum lengkap' });
    }

    // Check double-booking conflicts
    const [rows]: any = await db.query(
      "SELECT timeSlots FROM bookings WHERE courtId = ? AND date = ? AND status != 'cancelled'",
      [courtId, date]
    );
    
    const alreadyBooked = rows.some((b: any) => {
      const slots = typeof b.timeSlots === 'string' ? JSON.parse(b.timeSlots) : b.timeSlots;
      return slots.some((slot: number) => timeSlots.includes(slot));
    });

    if (alreadyBooked) {
      return res.status(400).json({ error: 'Jadwal telah di-booking orang lain baru-baru ini. Silakan pilih jam/lapangan lain.' });
    }

    const bookingId = `booking-${Date.now()}`;
    const actualUserId = userId || 'guest-temp-' + Math.random().toString(36).substr(2, 9);
    const actualPhone = userPhone || '-';

    await db.query(
      `INSERT INTO bookings (
        id, userId, userName, userEmail, userPhone, courtId, courtName, date, timeSlots, duration, equipmentRental, totalCost, dpPaid, status, paymentMethod, paymentProof
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        bookingId, actualUserId, userName, userEmail, actualPhone, courtId, courtName, date,
        JSON.stringify(timeSlots), timeSlots.length, JSON.stringify(equipmentRental || []),
        totalCost, dpPaid, 'pending_confirmation', paymentMethod, paymentProof || null
      ]
    );

    res.status(201).json({ success: true, id: bookingId });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, id, status });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bookings/:id/full-payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullPaymentProof } = req.body;

    await db.query('UPDATE bookings SET fullPaymentProof = ? WHERE id = ?', [fullPaymentProof, id]);
    res.json({ success: true, id, fullPaymentProof });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bookings/:id/acc-tunai', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE bookings SET dpPaid = totalCost, fullPaymentProof = ? WHERE id = ?', ['LUNAS_CASH', id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM bookings WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// --- STATS / REPORTS API ---
app.get('/api/stats', async (req, res) => {
  try {
    const [bookings]: any = await db.query('SELECT * FROM bookings');
    const [courts]: any = await db.query('SELECT id, category FROM courts');

    const approved = bookings.filter((b: any) => b.status === 'approved');
    const totalRevenue = approved.reduce((sum: number, b: any) => sum + (b.fullPaymentProof || b.dpPaid >= b.totalCost ? b.totalCost : b.dpPaid), 0);
    
    const popularityTracker: Record<string, number> = {
      futsal: 0,
      basket: 0,
      badminton: 0,
      padel: 0
    };

    bookings.forEach((b: any) => {
      const court = courts.find((c: any) => c.id === b.courtId);
      if (court && popularityTracker[court.category] !== undefined) {
        popularityTracker[court.category] += b.duration;
      }
    });

    const courtPopularity = Object.keys(popularityTracker).map(category => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: popularityTracker[category]
    }));

    const revenueByDayTracker: Record<string, number> = {};
    approved.forEach((b: any) => {
      // Need to format date properly for MySQL DATE types (they might be Date objects)
      const dateObj = new Date(b.date);
      const dayName = dateObj.toISOString().split('T')[0]; 
      const paidAmount = b.fullPaymentProof || b.dpPaid >= b.totalCost ? b.totalCost : b.dpPaid;
      revenueByDayTracker[dayName] = (revenueByDayTracker[dayName] || 0) + paidAmount;
    });

    const sortedDays = Object.keys(revenueByDayTracker).sort().slice(-7);
    const revenueByDay = sortedDays.map(day => ({
      day: day.substring(5), // "MM-DD"
      revenue: revenueByDayTracker[day]
    }));

    res.json({
      totalRevenue,
      pendingBookings: bookings.filter((b: any) => b.status === 'pending_confirmation').length,
      approvedBookings: approved.length,
      cancelledBookings: bookings.filter((b: any) => b.status === 'cancelled').length,
      courtPopularity,
      revenueByDay: revenueByDay.length > 0 ? revenueByDay : [{ day: '06-15', revenue: 0 }]
    });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// =========================================================================
// VITE OR STATIC BUILD MIDDLEWARE ENVIRONMENT
// =========================================================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SIPLAKRA] Server running on http://localhost:${PORT}`);
  });
}

startServer();
