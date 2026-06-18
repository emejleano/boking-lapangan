/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Booking, Court, Stats, PaymentMethod, User, AddonEquipment, Category } from '../types';
import { 
  FileText, Check, X, Settings, DollarSign, AlertCircle, RefreshCw,
  Edit2, BarChart, Grid, Search, Download, CreditCard, Image as ImageIcon, Info, Plus, Trash2, Calendar, User as UserIcon, Package, FolderTree
} from 'lucide-react';

interface AdminDashboardProps {
  courts: Court[];
  onRefreshCourts: () => void;
  equipments: AddonEquipment[];
  onRefreshEquipments: () => void;
  categories: Category[];
  onRefreshCategories: () => void;
}

export default function AdminDashboard({ courts, onRefreshCourts, equipments, onRefreshEquipments, categories, onRefreshCategories }: AdminDashboardProps) {
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'payments' | 'courts' | 'equipments' | 'categories' | 'users' | 'reports'>('dashboard');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  // Toast Notification State
  const [toastMsg, setToastMsg] = useState<{title: string, desc: string, type: 'error'|'success'|'info'} | null>(null);
  const showToast = (title: string, desc: string, type: 'error'|'success'|'info' = 'info') => {
    setToastMsg({ title, desc, type });
    setTimeout(() => setToastMsg(null), 4000);
  };
  
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending_confirmation' | 'approved' | 'cancelled'>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'all' | 'dp' | 'lunas'>('all');

  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newDesc, setNewDesc] = useState<string>('');
  const [newState, setNewState] = useState<'available' | 'maintenance'>('available');

  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);
  const [paymentName, setPaymentName] = useState('');
  const [paymentNumber, setPaymentNumber] = useState('');
  const [paymentType, setPaymentType] = useState<'bank'|'qris'>('bank');

  // Equipment CRUD States
  const [editingEquipment, setEditingEquipment] = useState<AddonEquipment | null>(null);
  const [equipmentName, setEquipmentName] = useState<string>('');
  const [equipmentCategory, setEquipmentCategory] = useState<'futsal' | 'basket' | 'badminton' | 'padel' | 'all'>('all');
  const [equipmentPrice, setEquipmentPrice] = useState<number>(0);
  const [showEquipmentModal, setShowEquipmentModal] = useState<boolean>(false);

  // Category CRUD States
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState<string>('');
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);

  // User CRUD States
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userNameEdit, setUserNameEdit] = useState<string>('');
  const [userEmailEdit, setUserEmailEdit] = useState<string>('');
  const [userPhoneEdit, setUserPhoneEdit] = useState<string>('');
  const [userPasswordEdit, setUserPasswordEdit] = useState<string>('');
  const [userRoleEdit, setUserRoleEdit] = useState<'customer' | 'admin'>('customer');

  // Reports
  const [reportStartDate, setReportStartDate] = useState<string>('');
  const [reportEndDate, setReportEndDate] = useState<string>('');
  const [reportCourtId, setReportCourtId] = useState<string>('all');
  const [reportPaymentStatusFilter, setReportPaymentStatusFilter] = useState<'all' | 'dp' | 'lunas'>('all');
  
  const [viewProof, setViewProof] = useState<string | null>(null);
  
  const [confirmDialog, setConfirmDialog] = useState<{message: string, onConfirm: () => void} | null>(null);

  const confirmAction = (message: string, action: () => void) => {
    setConfirmDialog({ message, onConfirm: () => {
      setConfirmDialog(null);
      action();
    }});
  };

  const fetchData = () => {
    setLoading(true);
    setErrorMsg('');
    Promise.all([
      fetch('/api/bookings').then(res => res.json()),
      fetch('/api/stats').then(res => res.json()),
      fetch('/api/payment-methods').then(res => res.json()),
      fetch('/api/users').then(res => res.json())
    ]).then(([bookingsData, statsData, paymentData, usersData]) => {
      bookingsData.sort((a: Booking, b: Booking) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setBookings(bookingsData);
      setStats(statsData);
      setPaymentMethods(paymentData);
      setUsers(usersData);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setErrorMsg('Gagal memuat data dari server.');
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateBookingStatus = (id: string, newStatus: 'approved' | 'cancelled') => {
    fetch(`/api/bookings/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    }).then(res => res.json()).then(() => {
      showToast('Status Diperbarui', `Reservasi berhasil diubah menjadi ${newStatus}.`, 'success');
      fetchData();
    }).catch(err => showToast('Gagal', err.message, 'error'));
  };

  const handleAccTunai = (id: string) => {
    confirmAction('Konfirmasi pelunasan tunai untuk pesanan ini?', () => {
      fetch(`/api/bookings/${id}/acc-tunai`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      }).then(res => res.json()).then(() => {
        showToast('Berhasil', 'Pelunasan tunai telah dikonfirmasi.', 'success');
        fetchData();
      }).catch(err => showToast('Gagal', err.message, 'error'));
    });
  };

  const handleSaveCourtChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourt) return;
    
    // Add new court
    if (editingCourt.id.startsWith('new-')) {
      fetch('/api/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingCourt, pricePerHour: newPrice, description: newDesc, status: newState })
      }).then(() => {
        setEditingCourt(null);
        showToast('Berhasil', 'Lapangan baru ditambahkan.', 'success');
        onRefreshCourts();
        fetchData();
      }).catch(err => showToast('Gagal', err.message, 'error'));
      return;
    }

    // Update existing court
    fetch(`/api/courts/${editingCourt.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pricePerHour: newPrice, description: newDesc, status: newState, image: editingCourt.image })
    }).then(() => {
      setEditingCourt(null);
      showToast('Lapangan Diperbarui', 'Data lapangan berhasil disimpan.', 'success');
      onRefreshCourts();
      fetchData();
    }).catch(err => showToast('Gagal', err.message, 'error'));
  };

  const handleDeleteCourt = (id: string) => {
    confirmAction('Hapus lapangan ini?', () => {
      fetch(`/api/courts/${id}`, { method: 'DELETE' })
        .then(() => {
          showToast('Dihapus', 'Lapangan berhasil dihapus.', 'success');
          onRefreshCourts();
          fetchData();
        }).catch(err => showToast('Gagal', err.message, 'error'));
    });
  };

  const handleDeleteUser = (id: string) => {
    confirmAction('Hapus pengguna ini?', () => {
      fetch(`/api/users/${id}`, { method: 'DELETE' })
        .then(() => {
          showToast('Dihapus', 'Pengguna berhasil dihapus.', 'success');
          fetchData();
        }).catch(err => showToast('Gagal', err.message, 'error'));
    });
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { type: paymentType, accountName: paymentName, accountNumber: paymentNumber };
    const p = editingPayment 
      ? fetch(`/api/payment-methods/${editingPayment.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) })
      : fetch(`/api/payment-methods`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload) });
    
    p.then(() => {
      setEditingPayment(null);
      showToast('Tersimpan', 'Metode pembayaran berhasil disimpan.', 'success');
      fetchData();
    }).catch(err => showToast('Gagal', err.message, 'error'));
  };

  const handleUploadQris = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPaymentNumber(data.url);
      showToast('Upload Berhasil', 'Gambar QRIS terunggah.', 'success');
    } catch (err: any) {
      showToast('Upload Gagal', err.message || 'Gagal mengunggah gambar QRIS', 'error');
    }
  };

  const handleSaveEquipment = () => {
    if (!equipmentName || equipmentPrice <= 0) {
      showToast('Error', 'Nama dan Harga alat tidak valid', 'error');
      return;
    }

    const payload = {
      name: equipmentName,
      category: equipmentCategory,
      price: equipmentPrice
    };

    const method = editingEquipment ? 'PUT' : 'POST';
    const url = editingEquipment ? `/api/equipments/${editingEquipment.id}` : '/api/equipments';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(res => res.json())
      .then(() => {
        onRefreshEquipments();
        setShowEquipmentModal(false);
        setEditingEquipment(null);
        showToast('Berhasil', 'Data alat sewa berhasil disimpan', 'success');
      }).catch(err => {
        console.error(err);
        showToast('Gagal', 'Terjadi kesalahan sistem', 'error');
      });
  };

  const handleDeleteEquipment = (id: string) => {
    confirmAction('Apakah Anda yakin ingin menghapus alat sewa ini?', () => {
      fetch(`/api/equipments/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => {
          onRefreshEquipments();
          showToast('Berhasil', 'Alat sewa berhasil dihapus', 'success');
        }).catch(err => {
          console.error(err);
          showToast('Gagal', 'Terjadi kesalahan saat menghapus alat sewa', 'error');
        });
    });
  };

  const handleSaveCategory = () => {
    if (!categoryName) {
      showToast('Error', 'Nama kategori tidak valid', 'error');
      return;
    }

    const method = editingCategory ? 'PUT' : 'POST';
    const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: categoryName })
    }).then(res => res.json())
      .then(() => {
        onRefreshCategories();
        setShowCategoryModal(false);
        setEditingCategory(null);
        showToast('Berhasil', 'Kategori berhasil disimpan', 'success');
      }).catch(err => {
        console.error(err);
        showToast('Gagal', 'Terjadi kesalahan sistem', 'error');
      });
  };

  const handleDeleteCategory = (id: string) => {
    confirmAction('Apakah Anda yakin ingin menghapus kategori ini? Pastikan tidak ada lapangan atau alat yang terhubung.', () => {
      fetch(`/api/categories/${id}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(() => {
          onRefreshCategories();
          showToast('Berhasil', 'Kategori berhasil dihapus', 'success');
        }).catch(err => {
          console.error(err);
          showToast('Gagal', 'Terjadi kesalahan saat menghapus kategori', 'error');
        });
    });
  };

  const handleUploadCourtImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !editingCourt) return;
    const formData = new FormData();
    formData.append('file', e.target.files[0]);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEditingCourt({ ...editingCourt, image: data.url });
      showToast('Upload Berhasil', 'Gambar Lapangan terunggah.', 'success');
    } catch (err: any) {
      showToast('Upload Gagal', err.message || 'Gagal mengunggah gambar lapangan', 'error');
    }
  };

  const handleSaveUserChanges = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const payload = {
      fullName: userNameEdit,
      email: userEmailEdit,
      phone: userPhoneEdit,
      password: userPasswordEdit || undefined,
      role: userRoleEdit
    };

    if (editingUser.id.startsWith('new-')) {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');
          setEditingUser(null);
          showToast('Berhasil', 'Pengguna baru ditambahkan.', 'success');
          fetchData();
        })
        .catch(err => showToast('Gagal', err.message, 'error'));
      return;
    }

    fetch(`/api/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memperbarui');
        setEditingUser(null);
        showToast('Berhasil', 'Data pengguna diperbarui.', 'success');
        fetchData();
      })
      .catch(err => showToast('Gagal', err.message, 'error'));
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.userName.toLowerCase().includes(searchQuery.toLowerCase()) || b.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const isLunas = !!b.fullPaymentProof || b.dpPaid >= b.totalCost;
    const matchesPaymentStatus = paymentStatusFilter === 'all' 
      ? true 
      : (paymentStatusFilter === 'lunas' ? isLunas : !isLunas);
      
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  const filteredReportBookings = bookings.filter(b => {
    if (b.status !== 'approved') return false;
    if (reportCourtId !== 'all' && b.courtId !== reportCourtId) return false;
    // Convert booking date to local Date object for safe comparison
    const bDate = new Date(b.date);
    bDate.setHours(0,0,0,0);

    if (reportStartDate) {
      const start = new Date(reportStartDate);
      start.setHours(0,0,0,0);
      if (bDate < start) return false;
    }
    if (reportEndDate) {
      const end = new Date(reportEndDate);
      end.setHours(23,59,59,999);
      if (bDate > end) return false;
    }
    
    const isLunas = !!b.fullPaymentProof || b.dpPaid >= b.totalCost;
    if (reportPaymentStatusFilter !== 'all') {
      if (reportPaymentStatusFilter === 'lunas' && !isLunas) return false;
      if (reportPaymentStatusFilter === 'dp' && isLunas) return false;
    }

    return true;
  });

  const totalReportRevenue = filteredReportBookings.reduce((sum, b) => sum + (b.fullPaymentProof || b.dpPaid >= b.totalCost ? b.totalCost : b.dpPaid), 0);

  const exportToCSV = () => {
    const data = filteredReportBookings.map(b => ({
      ID: b.id,
      Penyewa: b.userName,
      Telepon: b.userPhone,
      Tanggal: b.date,
      Lapangan: b.courtName,
      Durasi_Jam: b.duration,
      Total_Bayar: b.totalCost
    }));

    if (data.length === 0) {
      showToast('Kosong', 'Tidak ada data laporan untuk diexport.', 'info');
      return;
    }

    const headers = Object.keys(data[0]).join(',');
    const csvContent = [
      headers,
      ...data.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_GOR_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans bg-slate-50/50 min-h-screen" id="backoffice-panel">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2 font-display">
            <Settings className="w-6 h-6 text-indigo-600" />
            Admin Panel
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-xl">
          <button onClick={() => setActiveAdminTab('dashboard')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeAdminTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Dashboard</button>
          <button onClick={() => setActiveAdminTab('courts')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeAdminTab === 'courts' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Lapangan</button>
          <button onClick={() => setActiveAdminTab('categories')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeAdminTab === 'categories' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Kategori</button>
          <button onClick={() => setActiveAdminTab('equipments')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeAdminTab === 'equipments' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Alat Sewa</button>
          <button onClick={() => setActiveAdminTab('users')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeAdminTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Pengguna</button>
          <button onClick={() => setActiveAdminTab('payments')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeAdminTab === 'payments' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Pembayaran</button>
          <button onClick={() => setActiveAdminTab('reports')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${activeAdminTab === 'reports' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}>Laporan</button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl flex gap-2"><AlertCircle className="w-5 h-5" /><p className="text-xs font-bold">{errorMsg}</p></div>
      )}

      {activeAdminTab === 'dashboard' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border rounded-3xl p-5 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Omset</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">Rp {stats?.totalRevenue.toLocaleString() || 0}</span>
              </div>
              <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><DollarSign className="w-5 h-5" /></span>
            </div>
            <div className="bg-white border rounded-3xl p-5 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Antrean DP</span>
                <span className="text-2xl font-black text-amber-600 mt-1 block">{stats?.pendingBookings || 0}</span>
              </div>
              <span className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><FileText className="w-5 h-5" /></span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 bg-white border rounded-3xl p-6 shadow-xs overflow-hidden">
              <h3 className="text-sm font-extrabold flex items-center gap-2 mb-4"><BarChart className="w-4 h-4 text-indigo-600" /> Kelola Pengajuan Sewa</h3>
              
              <div className="flex gap-2 mb-4">
                <input type="text" placeholder="Cari..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="text-xs p-2 border rounded-lg flex-1" />
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="text-xs p-2 border rounded-lg">
                  <option value="all">Semua Status</option>
                  <option value="pending_confirmation">Pending</option>
                  <option value="approved">Approved</option>
                </select>
                <select value={paymentStatusFilter} onChange={e => setPaymentStatusFilter(e.target.value as any)} className="text-xs p-2 border rounded-lg">
                  <option value="all">Semua Pembayaran</option>
                  <option value="dp">Hanya DP</option>
                  <option value="lunas">Lunas</option>
                </select>
              </div>

              {loading ? <p className="text-xs text-center py-4">Loading...</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 uppercase text-[10px] text-slate-500">
                      <tr>
                        <th className="p-3 font-bold">Penyewa</th>
                        <th className="p-3 font-bold">Jadwal</th>
                        <th className="p-3 font-bold">Total / DP</th>
                        <th className="p-3 font-bold text-center">Status Bayar</th>
                        <th className="p-3 font-bold text-center">Bukti Bayar</th>
                        <th className="p-3 font-bold text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBookings.map(b => (
                        <tr key={b.id}>
                          <td className="p-3"><b>{b.userName}</b><br/><span className="text-slate-400">{b.userPhone}</span></td>
                          <td className="p-3"><b>{b.courtName}</b><br/>{b.date} ({b.duration} Jam)</td>
                          <td className="p-3">
                            <div className="flex flex-col items-start gap-1">
                              <span>Rp {b.totalCost.toLocaleString()}</span>
                              <span className="text-emerald-600 font-bold text-[10px]">DP: Rp {b.dpPaid.toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {(!!b.fullPaymentProof || b.dpPaid >= b.totalCost) ? (
                              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-bold">LUNAS</span>
                            ) : (
                              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[9px] font-bold">DP</span>
                            )}
                          </td>
                          <td className="p-3 text-center flex flex-col items-center gap-1">
                            {b.paymentProof ? (
                              <button onClick={() => setViewProof(b.paymentProof!)} className="text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1 text-[10px]">
                                <ImageIcon className="w-3 h-3" /> Bukti DP
                              </button>
                            ) : '-'}
                            {b.fullPaymentProof && b.fullPaymentProof !== 'TUNAI' && b.fullPaymentProof !== 'LUNAS_CASH' && (
                              <button onClick={() => setViewProof(b.fullPaymentProof!)} className="text-emerald-600 hover:text-emerald-800 underline flex items-center gap-1 text-[10px]">
                                <ImageIcon className="w-3 h-3" /> Pelunasan
                              </button>
                            )}
                            {b.fullPaymentProof === 'TUNAI' && (
                              <span className="text-amber-600 text-[10px] font-bold">Bayar Kasir</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {b.status === 'pending_confirmation' ? (
                              <div className="flex gap-1 justify-center">
                                <button onClick={() => handleUpdateBookingStatus(b.id, 'approved')} className="px-2 py-1 bg-emerald-600 text-white rounded font-bold">Approve</button>
                                <button onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')} className="px-2 py-1 bg-red-100 text-red-600 rounded font-bold">Tolak</button>
                              </div>
                            ) : b.status === 'approved' && b.dpPaid < b.totalCost ? (
                              <div className="flex gap-1 justify-center">
                                <button onClick={() => handleAccTunai(b.id)} className="px-2 py-1 bg-indigo-600 text-white rounded font-bold text-[10px]">ACC Tunai</button>
                              </div>
                            ) : (
                              <span className="font-bold text-slate-400">{b.status}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white border rounded-3xl p-6 shadow-xs h-fit">
              <h3 className="text-sm font-extrabold flex items-center gap-2 mb-4"><Grid className="w-4 h-4 text-indigo-600" /> Tarif Lapangan</h3>
              <div className="space-y-2">
                {courts.map(court => (
                  <div key={court.id} className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <b>{court.name}</b><br/>Rp {court.pricePerHour.toLocaleString()}/jam
                    </div>
                    <button onClick={() => { setEditingCourt(court); setNewPrice(court.pricePerHour); setNewDesc(court.description); setNewState(court.status); }} className="p-1.5 text-slate-500 hover:text-indigo-600 bg-white rounded border">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeAdminTab === 'payments' && (
        <div className="bg-white border rounded-3xl p-6 shadow-xs max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-extrabold flex items-center gap-2"><CreditCard className="w-5 h-5 text-indigo-600" /> Metode Pembayaran (Bank / QRIS)</h3>
            <button onClick={() => { setEditingPayment({ id: 0, type: 'bank', accountName: '', accountNumber: '', isEnabled: true }); setPaymentName(''); setPaymentNumber(''); setPaymentType('bank'); }} className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs">
              + Tambah Rekening / QRIS
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paymentMethods.map(pm => (
              <div key={pm.id} className="p-4 border rounded-2xl bg-slate-50 relative flex gap-4 items-center">
                <div className="flex-1">
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-md uppercase">{pm.type}</span>
                  <h4 className="font-bold text-slate-900 mt-2">{pm.accountName}</h4>
                  {pm.type === 'qris' && pm.accountNumber.startsWith('/uploads') ? (
                     <img src={pm.accountNumber} alt="QRIS" className="w-20 h-20 object-cover mt-2 rounded-lg border" />
                  ) : (
                     <p className="text-indigo-600 font-mono font-bold mt-1 tracking-wider">{pm.accountNumber}</p>
                  )}
                  <p className="text-[10px] mt-2 font-bold text-slate-500">Status: {pm.isEnabled ? 'Aktif' : 'Non-aktif'}</p>
                </div>
                <button onClick={() => { setEditingPayment(pm); setPaymentName(pm.accountName); setPaymentNumber(pm.accountNumber); setPaymentType(pm.type); }} className="p-2 bg-white border rounded-xl hover:text-indigo-600 shadow-xs cursor-pointer">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. COURTS TAB */}
      {activeAdminTab === 'courts' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Kelola Lapangan</h3>
            <button onClick={() => {
              setEditingCourt({ id: `new-${Date.now()}`, name: '', category: 'futsal', image: '', description: '', pricePerHour: 0, status: 'available' });
              setNewPrice(0); setNewDesc(''); setNewState('available');
            }} className="py-2 px-4 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 cursor-pointer">
              <Plus className="w-4 h-4" /> Tambah Lapangan
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 text-xs font-mono">
                <tr>
                  <th className="p-4 rounded-tl-xl border-b">LAPANGAN</th>
                  <th className="p-4 border-b">KATEGORI</th>
                  <th className="p-4 border-b">HARGA/JAM</th>
                  <th className="p-4 border-b">STATUS</th>
                  <th className="p-4 rounded-tr-xl border-b text-right">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {courts.map(c => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-800">{c.name}</td>
                    <td className="p-4 uppercase text-[10px] text-slate-500">{c.category}</td>
                    <td className="p-4 font-mono font-semibold">Rp {c.pricePerHour.toLocaleString('id-ID')}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${c.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {c.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => { setEditingCourt(c); setNewPrice(c.pricePerHour); setNewDesc(c.description); setNewState(c.status); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 cursor-pointer"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteCourt(c.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. USERS TAB */}
      {activeAdminTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Kelola Kategori Lapangan</h2>
              <p className="text-xs text-slate-500">Atur kategori yang tersedia untuk lapangan dan alat.</p>
            </div>
            <button onClick={() => {
              setEditingCategory(null);
              setCategoryName('');
              setShowCategoryModal(true);
            }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Tambah Kategori
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">ID</th>
                    <th className="p-4">Nama Kategori</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map(cat => (
                    <tr key={cat.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-mono text-slate-500">{cat.id}</td>
                      <td className="p-4 font-semibold text-slate-900 flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-indigo-500" />
                        {cat.name}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => {
                            setEditingCategory(cat);
                            setCategoryName(cat.name);
                            setShowCategoryModal(true);
                          }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-500">Belum ada kategori.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'equipments' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Kelola Alat Sewa</h2>
              <p className="text-xs text-slate-500">Atur perlengkapan yang dapat disewa pengunjung.</p>
            </div>
            <button onClick={() => {
              setEditingEquipment(null);
              setEquipmentName('');
              setEquipmentCategory('all');
              setEquipmentPrice(0);
              setShowEquipmentModal(true);
            }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Tambah Alat
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Nama Alat</th>
                    <th className="p-4">Kategori Lapangan</th>
                    <th className="p-4">Harga Sewa</th>
                    <th className="p-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {equipments.map(eq => (
                    <tr key={eq.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-semibold text-slate-900 flex items-center gap-2">
                        <Package className="w-4 h-4 text-indigo-500" />
                        {eq.name}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md capitalize font-medium">{eq.category}</span>
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-700">Rp {eq.price.toLocaleString('id-ID')}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => {
                            setEditingEquipment(eq);
                            setEquipmentName(eq.name);
                            setEquipmentCategory(eq.category);
                            setEquipmentPrice(eq.price);
                            setShowEquipmentModal(true);
                          }} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteEquipment(eq.id)} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {equipments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">Belum ada data alat sewa.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeAdminTab === 'users' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold flex items-center gap-2"><UserIcon className="w-5 h-5 text-indigo-600"/> Data Pengguna</h3>
            <button onClick={() => {
              setEditingUser({ id: `new-${Date.now()}`, fullName: '', email: '', phone: '', role: 'customer', password: '' });
              setUserNameEdit('');
              setUserEmailEdit('');
              setUserPhoneEdit('');
              setUserPasswordEdit('');
              setUserRoleEdit('customer');
            }} className="py-2 px-4 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 cursor-pointer">
              <Plus className="w-4 h-4" /> Tambah Pengguna
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 text-xs font-mono">
                <tr>
                  <th className="p-4 rounded-tl-xl border-b">NAMA & EMAIL</th>
                  <th className="p-4 border-b">TELEPON</th>
                  <th className="p-4 border-b">PASSWORD</th>
                  <th className="p-4 border-b">ROLE</th>
                  <th className="p-4 border-b text-right rounded-tr-xl">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50/50">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{u.fullName}</p>
                      <p className="text-[11px] text-slate-550">{u.email}</p>
                    </td>
                    <td className="p-4 font-mono text-slate-600">{u.phone}</td>
                    <td className="p-4 text-xs">
                      <p>Pwd: <span className="font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{u.password || '-'}</span></p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button onClick={() => {
                        setEditingUser(u);
                        setUserNameEdit(u.fullName);
                        setUserEmailEdit(u.email);
                        setUserPhoneEdit(u.phone);
                        setUserPasswordEdit(u.password || '');
                        setUserRoleEdit(u.role);
                      }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 cursor-pointer">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteUser(u.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. REPORTS TAB */}
      {activeAdminTab === 'reports' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 animate-fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-6">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2"><BarChart className="w-5 h-5 text-emerald-600"/> Laporan Pendapatan</h3>
              <p className="text-xs text-slate-500 mt-1">Hanya menampilkan reservasi yang telah di-Approve.</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-2xl flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-emerald-500" />
              <div>
                <p className="text-[10px] font-bold text-emerald-700 uppercase">Total Sesuai Filter</p>
                <p className="text-lg font-black font-mono text-emerald-800">Rp {totalReportRevenue.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Mulai Tanggal</label>
              <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="w-full p-2 text-xs border rounded-lg" />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Sampai Tanggal</label>
              <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} className="w-full p-2 text-xs border rounded-lg" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Filter Lapangan</label>
              <select value={reportCourtId} onChange={e => setReportCourtId(e.target.value)} className="w-full p-2 text-xs border rounded-lg bg-white">
                <option value="all">Semua Lapangan</option>
                {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Status Pembayaran</label>
              <select value={reportPaymentStatusFilter} onChange={e => setReportPaymentStatusFilter(e.target.value as any)} className="w-full p-2 text-xs border rounded-lg bg-white">
                <option value="all">Semua</option>
                <option value="dp">Baru DP</option>
                <option value="lunas">Lunas</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={exportToCSV} className="p-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center gap-2 cursor-pointer shadow-sm">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 text-xs font-mono">
                <tr>
                  <th className="p-3 border-b">ID / TANGGAL</th>
                  <th className="p-3 border-b">PENYEWA</th>
                  <th className="p-3 border-b">LAPANGAN</th>
                  <th className="p-3 border-b text-right">TOTAL BIAYA</th>
                </tr>
              </thead>
              <tbody>
                {filteredReportBookings.map(b => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-slate-50/50">
                    <td className="p-3">
                      <p className="font-mono text-[10px] text-slate-400">{b.id}</p>
                      <p className="font-bold text-slate-800">{b.date}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-800">{b.userName}</p>
                      <p className="text-[10px] text-slate-500">{b.userPhone}</p>
                    </td>
                    <td className="p-3 text-slate-700">{b.courtName} <span className="text-indigo-600 font-bold ml-1">({b.duration} Jam)</span></td>
                    <td className="p-3 text-right">
                      <p className="font-mono font-bold text-emerald-700">Rp {b.totalCost.toLocaleString('id-ID')}</p>
                      {(!!b.fullPaymentProof || b.dpPaid >= b.totalCost) ? (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase mt-1 inline-block">LUNAS</span>
                      ) : (
                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[9px] font-bold uppercase mt-1 inline-block">DP</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredReportBookings.length === 0 && (
              <p className="text-center p-6 text-slate-400 text-xs font-bold">Tidak ada data untuk filter ini.</p>
            )}
          </div>
        </div>
      )}

      {editingCourt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form onSubmit={handleSaveCourtChanges} className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold">{editingCourt.id.startsWith('new-') ? 'Tambah Lapangan' : `Edit ${editingCourt.name}`}</h3>
            
            {editingCourt.id.startsWith('new-') && (
              <>
                <input type="text" value={editingCourt.name} onChange={e => setEditingCourt({...editingCourt, name: e.target.value})} className="w-full p-2 border rounded text-xs" placeholder="Nama Lapangan" required />
                <select value={editingCourt.category} onChange={e => setEditingCourt({...editingCourt, category: e.target.value as any})} className="w-full p-2 border rounded text-xs" required>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Foto Lapangan</label>
              <div className="flex items-center gap-2">
                {editingCourt.image && (
                  <img src={editingCourt.image} alt="Preview" className="w-10 h-10 object-cover rounded-lg border" />
                )}
                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={handleUploadCourtImage} className="w-full text-xs p-1 border rounded bg-slate-50" />
                </div>
              </div>
            </div>

            <input type="number" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))} className="w-full p-2 border rounded text-xs" placeholder="Harga / Jam" required />
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} className="w-full p-2 border rounded text-xs h-20" placeholder="Deskripsi Fasilitas"></textarea>
            <select value={newState} onChange={e => setNewState(e.target.value as any)} className="w-full p-2 border rounded text-xs">
              <option value="available">Available</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditingCourt(null)} className="flex-1 py-2 border rounded text-xs font-bold">Batal</button>
              <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded text-xs font-bold">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {editingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form onSubmit={handleSavePayment} className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold">{editingPayment.id === 0 ? 'Tambah' : 'Edit'} Metode Pembayaran</h3>
            <select value={paymentType} onChange={e => setPaymentType(e.target.value as 'bank'|'qris')} className="w-full p-2 border rounded text-xs font-bold bg-slate-50">
              <option value="bank">Transfer Bank</option>
              <option value="qris">QRIS</option>
            </select>
            <input type="text" value={paymentName} onChange={e => setPaymentName(e.target.value)} placeholder={paymentType === 'bank' ? "Nama Bank & Atas Nama (cth: BCA - PT GOR)" : "Nama QRIS (cth: QRIS GOR L3VEL)"} className="w-full p-2 border rounded text-xs" required />
            
            {paymentType === 'bank' ? (
              <input type="text" value={paymentNumber} onChange={e => setPaymentNumber(e.target.value)} placeholder="Nomor Rekening" className="w-full p-2 border rounded text-xs font-mono" required />
            ) : (
              <div className="border p-4 rounded bg-slate-50 text-center">
                <input type="file" accept="image/*" onChange={handleUploadQris} className="w-full text-xs" />
                {paymentNumber && <p className="text-[10px] text-emerald-600 mt-2 font-bold">Gambar QRIS Tersimpan: {paymentNumber}</p>}
              </div>
            )}
            
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditingPayment(null)} className="flex-1 py-2 border rounded text-xs font-bold">Batal</button>
              <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded text-xs font-bold">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSaveCategory(); }} className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-lg">
            <h3 className="text-lg font-bold">{editingCategory ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama Kategori</label>
                <input type="text" value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="Contoh: Tenis Meja" className="w-full p-2 border rounded text-xs text-slate-800 bg-white" required />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowCategoryModal(false)} className="flex-1 py-2 border rounded text-xs font-bold text-slate-850">Batal</button>
              <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded text-xs font-bold">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {showEquipmentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSaveEquipment(); }} className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-lg">
            <h3 className="text-lg font-bold">{editingEquipment ? 'Edit Alat Sewa' : 'Tambah Alat Sewa'}</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama Alat</label>
                <input type="text" value={equipmentName} onChange={e => setEquipmentName(e.target.value)} placeholder="Contoh: Bola Futsal" className="w-full p-2 border rounded text-xs text-slate-800 bg-white" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Kategori Lapangan</label>
                <select value={equipmentCategory} onChange={e => setEquipmentCategory(e.target.value as any)} className="w-full p-2 border rounded text-xs bg-white text-slate-800">
                  <option value="all">Semua Lapangan (All)</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Harga Sewa (Rp)</label>
                <input type="number" value={equipmentPrice} onChange={e => setEquipmentPrice(Number(e.target.value))} className="w-full p-2 border rounded text-xs text-slate-800 bg-white" required />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowEquipmentModal(false)} className="flex-1 py-2 border rounded text-xs font-bold text-slate-850">Batal</button>
              <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded text-xs font-bold">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form onSubmit={handleSaveUserChanges} className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-lg">
            <h3 className="text-lg font-bold">{editingUser.id.startsWith('new-') ? 'Tambah Pengguna' : 'Edit Pengguna'}</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama Lengkap</label>
                <input type="text" value={userNameEdit} onChange={e => setUserNameEdit(e.target.value)} placeholder="Nama Lengkap" className="w-full p-2 border rounded text-xs text-slate-800 bg-white" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Email</label>
                <input type="email" value={userEmailEdit} onChange={e => setUserEmailEdit(e.target.value)} placeholder="Email" className="w-full p-2 border rounded text-xs text-slate-800 bg-white" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Nomor Telepon</label>
                <input type="text" value={userPhoneEdit} onChange={e => setUserPhoneEdit(e.target.value)} placeholder="Nomor Telepon" className="w-full p-2 border rounded text-xs text-slate-800 bg-white" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Password</label>
                <input type="text" value={userPasswordEdit} onChange={e => setUserPasswordEdit(e.target.value)} placeholder="Password" className="w-full p-2 border rounded text-xs font-mono text-slate-800 bg-white" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Role</label>
                <select value={userRoleEdit} onChange={e => setUserRoleEdit(e.target.value as any)} className="w-full p-2 border rounded text-xs bg-white text-slate-800">
                  <option value="customer">Customer (Penyewa)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-2 border rounded text-xs font-bold text-slate-850">Batal</button>
              <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded text-xs font-bold">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {viewProof && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewProof(null)}>
          <div className="bg-white p-2 rounded-2xl relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={viewProof} alt="Bukti Transfer" className="w-full h-auto rounded-xl max-h-[80vh] object-contain bg-slate-100" />
            <button onClick={() => setViewProof(null)} className="absolute -top-4 -right-4 bg-red-600 text-white w-8 h-8 rounded-full font-bold flex items-center justify-center shadow-lg">X</button>
          </div>
        </div>
      )}

      {/* Toast Notification Container */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`p-4 rounded-2xl shadow-lg border max-w-sm flex items-start gap-3 ${
            toastMsg.type === 'error' ? 'bg-red-50 border-red-200' :
            toastMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className={`shrink-0 mt-0.5 ${
              toastMsg.type === 'error' ? 'text-red-500' :
              toastMsg.type === 'success' ? 'text-emerald-500' :
              'text-blue-500'
            }`}>
              {toastMsg.type === 'error' ? <AlertCircle className="w-5 h-5" /> : 
               toastMsg.type === 'success' ? <Check className="w-5 h-5" /> : 
               <Info className="w-5 h-5" />}
            </div>
            <div>
              <h4 className={`text-sm font-bold ${
                toastMsg.type === 'error' ? 'text-red-800' :
                toastMsg.type === 'success' ? 'text-emerald-800' :
                'text-blue-800'
              }`}>{toastMsg.title}</h4>
              <p className={`text-xs mt-1 leading-relaxed ${
                toastMsg.type === 'error' ? 'text-red-600' :
                toastMsg.type === 'success' ? 'text-emerald-600' :
                'text-blue-600'
              }`}>{toastMsg.desc}</p>
            </div>
            <button onClick={() => setToastMsg(null)} className="ml-auto text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-lg text-center animate-fade-in">
            <div className="mx-auto w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-4 shadow-inner">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-800">{confirmDialog.message}</h3>
            <p className="text-xs text-slate-500">Tindakan ini akan diproses oleh sistem.</p>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setConfirmDialog(null)} className="flex-1 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition">Batal</button>
              <button onClick={confirmDialog.onConfirm} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 hover:bg-indigo-700 transition">Ya, Lanjutkan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
