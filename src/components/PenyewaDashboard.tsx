/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Court, Booking, User } from '../types';
import { ADDON_EQUIPMENTS, AVAILABLE_TIME_SLOTS } from '../data';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Check, 
  AlertCircle, 
  Plus, 
  Minus, 
  CreditCard, 
  ChevronRight, 
  ShieldCheck, 
  DollarSign, 
  FileText, 
  Activity,
  Award,
  Users,
  Grid,
  TrendingUp,
  Trash2,
  Download,
  Printer,
  ChevronLeft,
  X,
  HelpCircle,
  Phone,
  Mail,
  User as UserIcon,
  Sparkles,
  UploadCloud,
  Info
} from 'lucide-react';

interface PenyewaDashboardProps {
  currentUser: User | null;
  courts: Court[];
  onOpenAuth: () => void;
  selectedCourt: Court | null;
  setSelectedCourt: (court: Court | null) => void;
}

export default function PenyewaDashboard({
  currentUser,
  courts,
  onOpenAuth,
  selectedCourt,
  setSelectedCourt,
}: PenyewaDashboardProps) {
  // Category Filtering
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'futsal' | 'basket' | 'badminton' | 'padel'>('all');
  
  // Custom Booking States
  const [bookingDate, setBookingDate] = useState<string>('2026-06-15');
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [bookedSlots, setBookedSlots] = useState<number[]>([]);
  const [bookingStep, setBookingStep] = useState<number>(1);
  
  // Equipment Rental Quantities
  const [equipmentQuantities, setEquipmentQuantities] = useState<Record<string, number>>({});
  
  // Payment Details
  const [paymentMethod, setPaymentMethod] = useState<'transfer_bank' | 'qris'>('qris');
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentProof, setPaymentProof] = useState<string>('');
  const [uploadingProof, setUploadingProof] = useState<boolean>(false);
  const [loadingSchedule, setLoadingSchedule] = useState<boolean>(false);
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);
  const [lastBookingInfo, setLastBookingInfo] = useState<Booking | null>(null);
  const [bookingError, setBookingError] = useState<string>('');
  
  // User Bookings History
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  
  // Active filter for customer history tab list
  const [historyFilter, setHistoryFilter] = useState<'all' | 'pending' | 'approved'>('all');

  // Selected Booking for Invoice Viewer
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [invoiceBooking, setInvoiceBooking] = useState<Booking | null>(null);

  // Full Payment State
  const [showFullPaymentModal, setShowFullPaymentModal] = useState<boolean>(false);
  const [selectedBookingForFullPayment, setSelectedBookingForFullPayment] = useState<Booking | null>(null);
  const [uploadingFullPayment, setUploadingFullPayment] = useState<boolean>(false);
  const [fullPaymentMethod, setFullPaymentMethod] = useState<'transfer'|'tunai'>('transfer');

  // Toast Notification State
  const [toastMsg, setToastMsg] = useState<{title: string, desc: string, type: 'error'|'success'|'info'} | null>(null);
  const showToast = (title: string, desc: string, type: 'error'|'success'|'info' = 'info') => {
    setToastMsg({ title, desc, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Fetch court schedule / booked slots whenever selected court or date changes
  useEffect(() => {
    if (selectedCourt) {
      setLoadingSchedule(true);
      setSelectedSlots([]);
      fetch(`/api/schedule/${selectedCourt.id}/${bookingDate}`)
        .then((res) => res.json())
        .then((data) => {
          setBookedSlots(data.bookedSlots || []);
          setLoadingSchedule(false);
        })
        .catch((err) => {
          console.error('Gagal mengambil jadwal booked:', err);
          setLoadingSchedule(false);
        });
    }
  }, [selectedCourt, bookingDate]);

  const fetchUserHistory = () => {
    if (currentUser) {
      setLoadingHistory(true);
      fetch('/api/bookings')
        .then((res) => res.json())
        .then((data) => {
          // Filter history for current logged-in user or matches email
          const filtered = data.filter(
            (b: Booking) => b.userId === currentUser.id || b.userEmail === currentUser.email
          );
          // sort descending by latest
          filtered.sort((a: Booking, b: Booking) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setUserBookings(filtered);
          setLoadingHistory(false);
        })
        .catch((err) => {
          console.error(err);
          setLoadingHistory(false);
        });
    }
  };

  useEffect(() => {
    fetch('/api/payment-methods')
      .then(res => res.json())
      .then(data => setPaymentMethods(data.filter((pm: any) => pm.isEnabled)))
      .catch(console.error);
    fetchUserHistory();
  }, [currentUser, bookingSuccess]);

  const handleSelectSlot = (slotHour: number, isDisabled: boolean = false) => {
    if (isDisabled) {
      showToast('Tidak Tersedia', 'Jadwal ini sudah lewat waktu atau telah dipesan oleh orang lain.', 'error');
      return;
    }
    
    if (selectedSlots.includes(slotHour)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slotHour));
    } else {
      setSelectedSlots([...selectedSlots, slotHour].sort((a, b) => a - b));
    }
  };

  const handleQuantityChange = (eqId: string, delta: number) => {
    const currentQty = equipmentQuantities[eqId] || 0;
    const newQty = Math.max(0, currentQty + delta);
    setEquipmentQuantities({
      ...equipmentQuantities,
      [eqId]: newQty
    });
  };

  const handleCancelBooking = (bookingId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan pengajuan sewa ini?')) return;

    fetch(`/api/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' })
    })
      .then((res) => {
        if (!res.ok) throw new Error('Gagal membatalkan pesanan.');
        return res.json();
      })
      .then(() => {
        fetchUserHistory();
      })
      .catch((err) => alert(err.message));
  };

  const rentalDuration = selectedSlots.length;
  const courtBaseCost = selectedCourt ? selectedCourt.pricePerHour * rentalDuration : 0;
  
  const selectedEquipmentsList = (Object.entries(equipmentQuantities) as [string, number][])
    .filter(([_, qty]) => qty > 0)
    .map(([eqId, qty]) => {
      const eq = ADDON_EQUIPMENTS.find(e => e.id === eqId);
      return {
        name: eq ? eq.name : 'Unknown Equipment',
        price: eq ? eq.price : 0,
        quantity: qty
      };
    });

  const equipmentCost = selectedEquipmentsList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalCost = courtBaseCost + equipmentCost;
  const dpCost = Math.round(totalCost * 0.5);

  const resetForm = () => {
    setSelectedCourt(null);
    setSelectedSlots([]);
    setEquipmentQuantities({});
    setPaymentProof('');
    setBookingError('');
    setBookingStep(1);
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');

    if (!selectedCourt) return;
    if (selectedSlots.length === 0) {
      showToast('Jadwal Belum Dipilih', 'Silakan pilih minimal 1 jam slot jadwal lapangan!', 'error');
      return;
    }
    if (!paymentProof) {
      showToast('Bukti Pembayaran', 'Silakan unggah bukti pembayaran transfer/QRIS Anda terlebih dahulu!', 'error');
      return;
    }

    const payload = {
      userId: currentUser?.id || '',
      userEmail: currentUser?.email || 'guest@l3vel.com',
      userPhone: currentUser?.phone || '0812345678',
      userName: currentUser?.fullName || 'Tamu GOR',
      courtId: selectedCourt.id,
      courtName: selectedCourt.name,
      date: bookingDate,
      timeSlots: selectedSlots,
      equipmentRental: selectedEquipmentsList,
      totalCost,
      dpPaid: dpCost,
      paymentMethod,
      paymentProof,
    };

    fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Terjadi kesalahan sistem');
        }
        return data;
      })
      .then((createdBooking) => {
        setLastBookingInfo({
          ...payload,
          id: createdBooking.id,
          createdAt: new Date().toISOString(),
          status: 'pending_confirmation'
        } as Booking);
        setBookingSuccess(true);
        resetForm();
      })
      .catch((error) => {
        showToast('Gagal Submit', error.message, 'error');
      });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Check className="w-3 h-3" /> Lunas / Approved
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-200 line-through">
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            Menunggu Verifikasi DP
          </span>
        );
    }
  };

  // User Profile Edit States
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [fullNameEdit, setFullNameEdit] = useState<string>('');
  const [emailEdit, setEmailEdit] = useState<string>('');
  const [phoneEdit, setPhoneEdit] = useState<string>('');
  const [passwordEdit, setPasswordEdit] = useState<string>('');

  const handleOpenProfileModal = () => {
    if (!currentUser) return;
    
    fetch('/api/users')
      .then(res => res.json())
      .then(usersData => {
        const me = usersData.find((u: any) => u.id === currentUser.id);
        if (me) {
          setFullNameEdit(me.fullName);
          setEmailEdit(me.email);
          setPhoneEdit(me.phone);
          setPasswordEdit('');
          setShowProfileModal(true);
        } else {
          showToast('Error', 'Gagal memuat profil', 'error');
        }
      })
      .catch(() => showToast('Error', 'Gagal memuat profil', 'error'));
  };

  const handleConfirmTunai = async () => {
    if (!selectedBookingForFullPayment) return;
    setUploadingFullPayment(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBookingForFullPayment.id}/full-payment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullPaymentProof: 'TUNAI' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast('Berhasil', 'Status Bayar Tunai diteruskan. Silakan melunasi di Kasir.', 'success');
      setShowFullPaymentModal(false);
      setSelectedBookingForFullPayment(null);
      fetchUserHistory();
    } catch (err: any) {
      showToast('Gagal', err.message || 'Gagal mengirim konfirmasi', 'error');
    } finally {
      setUploadingFullPayment(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const payload = {
      fullName: fullNameEdit,
      email: emailEdit,
      phone: phoneEdit,
      password: passwordEdit || undefined,
      role: currentUser.role
    };

    fetch(`/api/users/${currentUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');
        
        const updatedUser = { ...currentUser, fullName: fullNameEdit, email: emailEdit, phone: phoneEdit };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        showToast('Berhasil', 'Profil Anda berhasil diperbarui!', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        setShowProfileModal(false);
      })
      .catch(err => showToast('Gagal', err.message, 'error'));
  };

  const filteredCourts = courts.filter(court => {
    if (selectedCategory === 'all') return true;
    return court.category === selectedCategory;
  });

  const filteredBookingHistory = userBookings.filter(b => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'pending') return b.status === 'pending_confirmation';
    if (historyFilter === 'approved') return b.status === 'approved';
    return true;
  });

  const totalBookingsCount = userBookings.length;
  const approvedBookingsCount = userBookings.filter(b => b.status === 'approved').length;
  const lunasBookingsCount = userBookings.filter(b => b.status === 'approved' && ((!!b.fullPaymentProof && b.fullPaymentProof !== 'TUNAI') || b.dpPaid >= b.totalCost)).length;
  const dpBookingsCount = userBookings.filter(b => b.status === 'approved' && !((!!b.fullPaymentProof && b.fullPaymentProof !== 'TUNAI') || b.dpPaid >= b.totalCost)).length;
  const pendingBookingsCount = userBookings.filter(b => b.status === 'pending_confirmation').length;
  const totalAmountSpent = userBookings
    .filter(b => b.status === 'approved')
    .reduce((sum, b) => sum + (((!!b.fullPaymentProof && b.fullPaymentProof !== 'TUNAI') || b.dpPaid >= b.totalCost) ? b.totalCost : b.dpPaid), 0);

  const displayInvoice = (booking: Booking) => {
    setInvoiceBooking(booking);
    setShowInvoiceModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans bg-slate-50/50" id="penyewa-dashboard-view">
      
      {currentUser && (
        <div className="mb-10 p-6 sm:p-8 bg-white border border-slate-200 rounded-3xl shadow-xs relative overflow-hidden">
          <div className="absolute right-0 top-0 -mr-16 -mt-16 w-56 h-56 bg-indigo-50 rounded-full blur-2xl opacity-70 pointer-events-none" />
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold font-mono uppercase rounded-full">
                  Penyewa Registered
                </span>
                <span className="text-slate-400 text-xs font-mono">• Session ID {currentUser.id.substring(0, 8)}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display flex items-center gap-2">
                Halo, {currentUser.fullName} <span className="animate-bounce">👋</span>
              </h2>
              <p className="text-slate-550 text-xs sm:text-sm">
                Kelola pesanan jadwal, sewa alat tambahan, dan cetak invoice pembayaran GOR Anda dengan praktis.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={handleOpenProfileModal}
                className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-sm transition cursor-pointer flex items-center gap-1.5"
              >
                <UserIcon className="w-4 h-4" /> Edit Profil Saya
              </button>
              <a 
                href="#katalog-lapangan"
                className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs sm:text-sm shadow-sm transition"
              >
                Sewa Lapangan Baru
              </a>
              <a 
                href="#histori-sewa-section"
                className="px-5 py-3 bg-white hover:bg-slate-55 text-slate-750 border border-slate-200 font-bold rounded-2xl text-xs sm:text-sm transition flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" /> Riwayat Sewa ({totalBookingsCount})
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
            <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/60">
              <span className="text-[10px] font-semibold text-slate-450 uppercase uppercase font-mono tracking-wider">Total Reservasi</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-slate-800 font-mono">{totalBookingsCount}</span>
                <span className="p-1.5 bg-white text-indigo-600 rounded-lg border border-slate-200 text-xs"><Grid className="w-3.5 h-3.5" /></span>
              </div>
            </div>

            <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/60">
              <span className="text-[10px] font-semibold text-slate-450 uppercase uppercase font-mono tracking-wider">Lunas</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">{lunasBookingsCount}</span>
                <span className="p-1.5 bg-white text-emerald-600 rounded-lg border border-slate-200 text-xs"><Check className="w-3.5 h-3.5" /></span>
              </div>
            </div>

            <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/60">
              <span className="text-[10px] font-semibold text-slate-450 uppercase uppercase font-mono tracking-wider">Belum Lunas (DP)</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-amber-700 font-mono">{dpBookingsCount}</span>
                <span className="p-1.5 bg-white text-amber-600 rounded-lg border border-slate-200 text-xs"><Activity className="w-3.5 h-3.5" /></span>
              </div>
            </div>

            <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/60">
              <span className="text-[10px] font-semibold text-slate-450 uppercase uppercase font-mono tracking-wider">Total Pembayaran</span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xl sm:text-2xl font-black text-slate-800 font-mono">Rp{(totalAmountSpent / 1000).toFixed(0)}k</span>
                <span className="p-1.5 bg-white text-slate-600 rounded-lg border border-slate-200 text-xs"><DollarSign className="w-3.5 h-3.5" /></span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8" id="katalog-lapangan">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 font-display">
              <Award className="w-6 h-6 text-indigo-600" />
              Sewa Fasilitas Lapangan GOR
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">Pilih kategori olahraga premium Anda di bawah ini</p>
          </div>
          
          <div className="flex flex-wrap gap-1.5 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs">
            {(['all', 'futsal', 'basket', 'badminton', 'padel'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl capitalize transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-905 hover:bg-slate-50'
                }`}
              >
                {cat === 'all' ? 'Semua' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourts.map((court) => (
            <div 
              key={court.id} 
              className={`bg-white rounded-3xl overflow-hidden border transition-all duration-305 flex flex-col justify-between shadow-xs ${
                selectedCourt?.id === court.id 
                  ? 'border-indigo-600 ring-2 ring-indigo-650/10' 
                  : 'border-slate-200 hover:border-slate-350 hover:shadow-xs'
              }`}
            >
              <div>
                <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100">
                  <img 
                    src={court.image} 
                    alt={court.name}
                    className="w-full h-full object-cover transform hover:scale-105 transition duration-500" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-white/95 text-indigo-700 text-[10px] font-mono tracking-widest uppercase font-black rounded-lg border border-indigo-100 shadow-xs">
                      {court.category}
                    </span>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-white/95 px-3 py-1.5 rounded-xl text-slate-900 font-mono font-bold text-xs tracking-tight border border-slate-200 shadow-md">
                    Rp {court.pricePerHour.toLocaleString('id-ID')} <span className="text-[10px] font-normal text-slate-500">/ jam</span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 font-display">{court.name}</h3>
                  <p className="text-slate-600 text-xs mt-2.5 line-clamp-3 leading-relaxed font-sans">
                    {court.description}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0">
                {court.status === 'maintenance' ? (
                  <div className="w-full text-center py-3 text-xs font-semibold bg-red-50 text-red-650 rounded-2xl border border-red-150">
                    Sedang Perawatan (Maintenance)
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedCourt(court);
                      setTimeout(() => {
                        document.getElementById('form-booking-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedCourt?.id === court.id
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {selectedCourt?.id === court.id ? 'LAPANGAN TERPILIH' : 'BOOKING LAPANGAN'} <ChevronRight className="w-4 h-4 ml-0.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="form-booking-section" className="mt-14 scroll-mt-20">
        {selectedCourt ? (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 sm:p-8 bg-slate-50/50 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <span className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
                    <Clock className="w-6 h-6" />
                  </span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 font-display">Lengkapi Formulir Reservasi</h3>
                    <p className="text-indigo-600 font-semibold text-xs mt-0.5">Lapangan GOR: <span className="text-slate-800 font-bold">{selectedCourt.name}</span></p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs rounded-xl self-start sm:self-center transition-all font-bold cursor-pointer"
                >
                  Ganti Lapangan
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 sm:p-8 space-y-6">
              <div className="mb-8 border-b border-slate-100 pb-6">
                <div className="flex items-center justify-between max-w-md mx-auto relative px-4">
                  <div className="absolute left-6 right-6 top-5 h-0.5 bg-slate-100 -z-10" />
                  <div 
                    className="absolute left-6 top-5 h-0.5 bg-indigo-600 transition-all duration-300 -z-10" 
                    style={{ width: `${bookingStep === 1 ? '0%' : bookingStep === 2 ? '50%' : '100%'}` }}
                  />
                  
                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold font-mono text-sm transition-all cursor-pointer ${
                        bookingStep === 1 
                          ? 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-50' 
                          : bookingStep > 1 
                            ? 'bg-emerald-500 text-white border-emerald-500 font-extrabold' 
                            : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      {bookingStep > 1 ? '✓' : '1'}
                    </button>
                    <span className={`text-[10px] sm:text-xs font-bold tracking-tight ${bookingStep === 1 ? 'text-indigo-600 font-extrabold' : 'text-slate-400'}`}>Step 1: Jadwal</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <button
                      type="button"
                      disabled={selectedSlots.length === 0}
                      onClick={() => setBookingStep(2)}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold font-mono text-sm transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                        bookingStep === 2 
                          ? 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-50' 
                          : bookingStep > 2 
                            ? 'bg-emerald-500 text-white border-emerald-500 font-extrabold' 
                            : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      {bookingStep > 2 ? '✓' : '2'}
                    </button>
                    <span className={`text-[10px] sm:text-xs font-bold tracking-tight ${bookingStep === 2 ? 'text-indigo-600 font-extrabold' : 'text-slate-400'}`}>Step 2: Alat Sewa</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5 z-10">
                    <button
                      type="button"
                      disabled={selectedSlots.length === 0}
                      onClick={() => setBookingStep(3)}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold font-mono text-sm transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                        bookingStep === 3 
                          ? 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-50' 
                          : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      3
                    </button>
                    <span className={`text-[10px] sm:text-xs font-bold tracking-tight ${bookingStep === 3 ? 'text-indigo-600' : 'text-slate-400'}`}>Step 3: Bayar DP</span>
                  </div>
                </div>
              </div>

              {!currentUser && (
                <div className="p-4 bg-amber-50 text-amber-850 rounded-2xl border border-amber-200 text-xs sm:text-sm flex gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-bold">Mode Tamu (Guest Mode) Terdeteksi</p>
                    <p className="mt-1 opacity-90 leading-relaxed text-slate-700">
                      Anda belum masuk akun. Anda tetap dapat melakukan reservasi lapangan, namun status sewa tidak terekam otomatis di perangkat lain. 
                      <button 
                        type="button" 
                        onClick={onOpenAuth} 
                        className="text-indigo-650 font-bold underline hover:text-indigo-800 ml-1.5 cursor-pointer"
                      >
                        Login / Register sekarang
                      </button> untuk pengaman akun lapis dua dengan PIN.
                    </p>
                  </div>
                </div>
              )}

              {bookingError && (
                <div className="p-4 bg-red-50 text-red-650 rounded-2xl border border-red-150 flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-xs font-semibold">{bookingError}</p>
                </div>
              )}

              {bookingStep === 1 && (
                <div className="space-y-6 max-w-2xl mx-auto transition-all animate-fade-in">
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-6">
                    <div>
                      <label className="block text-slate-700 text-xs sm:text-sm font-bold mb-2 flex items-center gap-1.5 font-display">
                        <CalendarIcon className="w-4 h-4 text-indigo-600" />
                        1. TENTUKAN TANGGAL SEWA
                      </label>
                      <input 
                        type="date" 
                        value={bookingDate} 
                        onChange={(e) => setBookingDate(e.target.value)}
                        min="2026-06-15"
                        className="w-full p-3.5 bg-white text-slate-850 rounded-2xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-sans font-semibold text-xs sm:text-sm"
                      />
                      <p className="text-[10px] text-slate-500 mt-1.5">Jadwal validasi GOR dibuka mulai hari ini.</p>
                    </div>

                    <div>
                      <label className="block text-slate-700 text-xs sm:text-sm font-bold mb-2 flex items-center gap-1.5 font-display">
                        <Clock className="w-4 h-4 text-indigo-600" />
                        2. PILIH JAM OPERASIONAL {loadingSchedule && <span className="text-[10px] text-slate-400 font-normal animate-pulse">(Mengecek ketersediaan...)</span>}
                      </label>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-2 bg-white rounded-2xl border border-slate-200" id="schedule-slots-selector">
                        {AVAILABLE_TIME_SLOTS.map((slot) => {
                          const isBooked = bookedSlots.includes(slot.hour);
                          const isSelected = selectedSlots.includes(slot.hour);
                          const now = new Date();
                          const offsetMs = now.getTimezoneOffset() * 60 * 1000;
                          const localNow = new Date(now.getTime() - offsetMs);
                          const todayStr = localNow.toISOString().split('T')[0];
                          const currentHour = now.getHours();
                          const isPassed = bookingDate === todayStr && slot.hour <= currentHour;
                          const isDisabled = isBooked || isPassed;
                          
                          return (
                            <button
                              key={slot.hour}
                              type="button"
                              onClick={() => handleSelectSlot(slot.hour, isDisabled)}
                              className={`p-3 text-[11px] font-mono font-bold rounded-xl transition-all border text-center ${
                                isBooked
                                  ? 'bg-blue-100 text-blue-600 border-blue-200 cursor-not-allowed'
                                  : isPassed
                                    ? 'bg-red-50 text-red-500 border-red-100 cursor-not-allowed'
                                    : isSelected 
                                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs ring-2 ring-indigo-200'
                                      : 'bg-white text-slate-650 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 border-slate-200'
                              }`}
                            >
                              {slot.label} {isBooked ? ' (Full)' : isPassed ? ' (Lewat)' : ''}
                            </button>
                          );
                        })}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-3 px-1 text-[10px] font-bold text-slate-600">
                        <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-slate-300 rounded-sm"></div> Tersedia</span>
                        <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-indigo-600 rounded-sm"></div> Dipilih</span>
                        <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded-sm flex items-center justify-center"><X className="w-2.5 h-2.5 text-blue-500" /></div> Sudah Dibooking</span>
                        <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-50 border border-red-200 rounded-sm flex items-center justify-center"><X className="w-2.5 h-2.5 text-red-500" /></div> Lewat Waktu</span>
                      </div>
                      
                      <p className="text-[10px] text-slate-500 mt-2">Dapat menyewa beberapa slot sekaligus (misal: 14:00 - 16:00 berarti pilih 2 slot).</p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      disabled={selectedSlots.length === 0}
                      onClick={() => setBookingStep(2)}
                      className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 transition duration-150 cursor-pointer"
                    >
                      Lanjut ke Tambahan Alat <ChevronRight className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              )}

              {bookingStep === 2 && (
                <div className="space-y-6 max-w-2xl mx-auto transition-all animate-fade-in">
                  
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-indigo-800">
                    <div>
                      <span className="font-bold block text-[10px] uppercase text-indigo-600 tracking-wider">Metrik Booking Terkunci:</span>
                      <p className="font-bold text-slate-800">Tanggal: {bookingDate} • Durasi: {selectedSlots.length} Jam</p>
                      <p className="text-slate-600 font-mono text-[11px]">Jam: {selectedSlots.sort((a,b)=>a-b).map(s => `${String(s).padStart(2,'0')}:00`).join(', ')}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      className="text-indigo-600 hover:text-indigo-800 font-black underline cursor-pointer self-end sm:self-center"
                    >
                      Ubah Jadwal
                    </button>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
                    <div>
                      <label className="block text-slate-700 text-xs sm:text-sm font-bold flex items-center gap-1.5 font-display">
                        <Plus className="w-4.5 h-4.5 text-indigo-600" />
                        TAMBAH SEWA PERALATAN (OPSIONAL)
                      </label>
                      <p className="text-slate-500 text-xs mt-1">Sistem kami menyewakan sarana premium untuk memaksimalkan performa olahraga Anda.</p>
                    </div>

                    <div className="space-y-2 bg-white rounded-2xl p-4 border border-slate-200" id="addon-rental-box">
                      {ADDON_EQUIPMENTS
                        .filter(item => item.category === selectedCourt.category || item.category === 'all')
                        .map((eq) => {
                          const qty = equipmentQuantities[eq.id] || 0;
                          return (
                            <div key={eq.id} className="flex justify-between items-center p-3.5 bg-slate-50/40 rounded-xl border border-slate-150 hover:border-slate-350 transition shadow-xs">
                              <div className="flex-1 pr-2">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-855">{eq.name}</h4>
                                <span className="text-[11px] text-slate-500 font-mono block mt-0.5">Rp {eq.price.toLocaleString('id-ID')} / Pcs</span>
                              </div>
                              
                              <div className="flex items-center gap-2.5">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(eq.id, -1)}
                                  disabled={qty === 0}
                                  className="w-8 h-8 flex items-center justify-center bg-white text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 border border-slate-200 rounded-lg transition cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs sm:text-sm font-bold font-mono text-slate-850 w-5 text-center">{qty}</span>
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(eq.id, 1)}
                                  className="w-8 h-8 flex items-center justify-center bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setBookingStep(1)}
                      className="px-5 py-4 bg-white border border-slate-205 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold rounded-2xl flex items-center gap-1.5 transition duration-150 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" /> Kembali ke Jadwal
                    </button>

                    <button
                      type="button"
                      onClick={() => setBookingStep(3)}
                      className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm flex items-center gap-2 transition duration-150 cursor-pointer"
                    >
                      Lanjut ke Rincian DP <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {bookingStep === 3 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto transition-all animate-slide-up">
                  <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4">
                      <h3 className="text-xs font-bold font-mono text-slate-400 tracking-wider uppercase border-b border-slate-200/80 pb-2">RINCIAN PERHITUNGAN BIAYA</h3>
                      
                      <div className="space-y-2.5 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Total Durasi Sewa Lapangan:</span>
                          <span className="font-mono text-slate-800 font-bold">{rentalDuration} Jam</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span>Tarif Lapangan:</span>
                          <span className="font-mono text-slate-800 font-semibold">Rp {selectedCourt.pricePerHour.toLocaleString()} / Jam</span>
                        </div>

                        <div className="flex justify-between border-b border-dashed border-slate-200 pb-2 text-slate-500">
                          <span>Subtotal Sewa Lapangan:</span>
                          <span className="font-mono font-bold text-slate-800">Rp {courtBaseCost.toLocaleString('id-ID')}</span>
                        </div>

                        {selectedEquipmentsList.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-slate-500 font-semibold text-[11px]">Sewa Alat Tambahan:</span>
                            <div className="space-y-1 pl-3 border-l-2 border-indigo-100">
                              {selectedEquipmentsList.map((item, i) => (
                                <div key={i} className="flex justify-between text-[11px] text-slate-500">
                                  <span>{item.name} ({item.quantity} x)</span>
                                  <span className="font-mono font-medium">Rp {(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between border-b border-dashed border-slate-200 pb-2 pl-3 text-[11px] font-semibold text-slate-705">
                              <span>Subtotal Alat Addon:</span>
                              <span className="font-mono text-slate-805">Rp {equipmentCost.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-205 pt-3.5 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-slate-800">
                          <span className="text-xs sm:text-sm font-extrabold text-slate-700">TOTAL RESERVASI LENGKAP:</span>
                          <span className="text-base sm:text-lg font-black font-mono text-indigo-700">
                            Rp {totalCost.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <div className="p-3 bg-indigo-50/50 border border-indigo-150 rounded-2xl flex justify-between items-center text-xs text-indigo-700 mt-2 font-black">
                          <span>DP Pembayaran Minimal (50%):</span>
                          <span className="font-mono font-black text-sm">Rp {dpCost.toLocaleString('id-ID')}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-normal font-sans">
                          *Untuk mengamankan jadwal, sistem mensyaratkan transfer uang muka 50% atau lunas. Status akan diverifikasi admin secara real-time.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 flex flex-col justify-between">
                    <div className="space-y-3">
                      <label className="block text-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-1.5 font-display">
                        <CreditCard className="w-4 h-4 text-indigo-600" />
                        PILIH METODE BAYAR ONLINE
                      </label>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('qris')}
                          className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between h-24 cursor-pointer ${
                            paymentMethod === 'qris'
                              ? 'border-indigo-600 bg-indigo-50/20'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs font-bold text-slate-800">QRIS E-Wallet</span>
                          <span className="text-[9px] text-slate-450 block leading-tight">ShopeePay, OVO, GoPay, Dana, LinkAja</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('transfer_bank')}
                          className={`p-3 rounded-2xl border transition-all text-left flex flex-col justify-between h-24 cursor-pointer ${
                            paymentMethod === 'transfer_bank'
                              ? 'border-indigo-600 bg-indigo-50/20'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <span className="text-xs font-bold text-slate-800">Transfer Bank</span>
                          <span className="text-[9px] text-slate-450 block leading-tight">M-Banking BCA, BNI, Mandiri VA</span>
                        </button>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                        {paymentMethod === 'qris' ? (
                          paymentMethods.filter(pm => pm.type === 'qris').map(pm => (
                            <div key={pm.id} className="flex flex-col items-center">
                              <h4 className="font-bold text-slate-800 mb-2">{pm.accountName}</h4>
                              <img src={pm.accountNumber} alt="QRIS" className="w-48 h-48 border rounded-lg" />
                              <p className="text-xs mt-2 text-slate-500 text-center">Scan QRIS di atas untuk membayar DP Rp {dpCost.toLocaleString('id-ID')}</p>
                            </div>
                          ))
                        ) : (
                          <div className="space-y-2 text-xs">
                            <h4 className="font-bold text-slate-800 mb-2 border-b pb-1">Daftar Rekening Bank</h4>
                            {paymentMethods.filter(pm => pm.type === 'bank').map(pm => (
                              <div key={pm.id} className="flex justify-between border-b pb-1 border-slate-200">
                                <span className="font-medium text-slate-600">{pm.accountName}</span>
                                <span className="font-bold font-mono text-slate-900">{pm.accountNumber}</span>
                              </div>
                            ))}
                            <p className="text-xs text-slate-500 mt-2 text-center">Transfer DP sejumlah Rp {dpCost.toLocaleString('id-ID')} ke salah satu rekening di atas.</p>
                          </div>
                        )}
                        
                        <div className="mt-4 pt-4 border-t border-slate-200">
                           <label className="block text-xs font-bold text-slate-700 mb-2">Unggah Bukti Pembayaran (Wajib)</label>
                           <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition overflow-hidden">
                             <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
                               {uploadingProof ? (
                                 <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
                               ) : paymentProof ? (
                                 <Check className="w-8 h-8 text-emerald-500 mb-2" />
                               ) : (
                                 <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                               )}
                               <p className="text-xs font-semibold">{paymentProof ? 'Bukti Berhasil Terunggah' : uploadingProof ? 'Sedang Mengunggah...' : 'Klik untuk memilih gambar bukti'}</p>
                             </div>
                             <input 
                               type="file" 
                               accept="image/*"
                               className="hidden"
                               onChange={async (e) => {
                                 if (!e.target.files || e.target.files.length === 0) return;
                                 setUploadingProof(true);
                                 const formData = new FormData();
                                 formData.append('file', e.target.files[0]);
                                 try {
                                   const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                   const data = await res.json();
                                   if (!res.ok) throw new Error(data.error);
                                   setPaymentProof(data.url);
                                   showToast('Upload Berhasil', 'Bukti pembayaran telah berhasil disimpan.', 'success');
                                 } catch (err: any) {
                                   showToast('Upload Gagal', err.message || 'Terjadi kesalahan saat mengunggah.', 'error');
                                 } finally {
                                   setUploadingProof(false);
                                 }
                               }}
                             />
                           </label>
                           {paymentProof && (
                             <div className="mt-3 text-center">
                               <a href={paymentProof} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 font-bold hover:underline bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 inline-block">Lihat Bukti yang Diunggah</a>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                      <button
                        type="button"
                        onClick={() => setBookingStep(2)}
                        className="w-full sm:w-auto px-5 py-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-1.5 transition text-xs cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" /> Kembali
                      </button>

                      <button
                        type="submit"
                        className="w-full sm:flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer border border-indigo-500"
                      >
                        <ShieldCheck className="w-5 h-5 animate-pulse" />
                        SUBMIT RESERVASI & DP
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </form>
          </div>
        ) : (
          <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-850">Belum Ada Fasilitas yang Dipilih</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
              Silakan pilih salah satu lapangan olahraga pada galeri di atas untuk memantau jadwal sewa dan memilih peralatan.
            </p>
          </div>
        )}
      </div>

      {bookingSuccess && lastBookingInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg relative">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 flex items-center justify-center mx-auto mb-3.5">
              <Check className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-slate-900 text-center font-display">Pemesanan Berhasil Terkirim!</h3>
            <p className="text-xs text-slate-500 text-center mt-1 leading-relaxed">
              Jadwal Anda berhasil diajukan. Silakan tunggu konfirmasi status DP pembayaran dari admin GOR.
            </p>

            <div className="bg-slate-50 rounded-2xl p-4 mt-5 space-y-2 text-xs font-sans border border-slate-200 text-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-450">ID Reservasi:</span>
                <span className="font-mono text-slate-800 font-bold select-all">{lastBookingInfo.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-455">Lapangan:</span>
                <span className="text-slate-805 font-bold">{lastBookingInfo.courtName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450">Tanggal & Jam:</span>
                <span className="text-slate-800 font-mono font-medium">{lastBookingInfo.date} • {lastBookingInfo.timeSlots.map(s => `${String(s).padStart(2,'0')}:00`).join(', ')}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-800">
                <span className="font-bold">Total Tagihan:</span>
                <span className="font-bold text-indigo-700 font-mono text-sm">Rp {lastBookingInfo.totalCost.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2 text-slate-700">
                <span>DP Pembayaran ({lastBookingInfo.paymentMethod.toUpperCase()}):</span>
                <span className="font-bold font-mono text-indigo-700">Rp {lastBookingInfo.dpPaid.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2 text-[10px] text-amber-800">
                <span>Status Pemesanan:</span>
                <span>{getStatusBadge(lastBookingInfo.status)}</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setBookingSuccess(false);
                  displayInvoice(lastBookingInfo);
                }}
                className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak Tiket
              </button>
              <button
                onClick={() => setBookingSuccess(false)}
                className="py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {showInvoiceModal && invoiceBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-205 rounded-3xl max-w-lg w-full overflow-hidden shadow-xl" id="printable-invoice">
            <div className="h-2.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-800" />
            
            <div className="p-6 sm:p-8 space-y-6">
              
              <div className="flex items-center justify-between border-b border-slate-105 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight font-display">TICKET & INVOICE</h3>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-indigo-600 font-bold">SIPLAKRA GOR L3VEL</p>
                </div>
                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-700 border border-indigo-100">
                  <Printer className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <span className="text-slate-450 uppercase text-[9px] font-mono tracking-wider">KODE BOOKING</span>
                  <p className="font-mono text-slate-800 font-black text-sm select-all">{invoiceBooking.id}</p>
                </div>
                <div>
                  <span className="text-slate-450 uppercase text-[9px] font-mono tracking-wider">STATUS RESERVASI</span>
                  <div className="mt-1">{getStatusBadge(invoiceBooking.status)}</div>
                </div>
                <div>
                  <span className="text-slate-450 uppercase text-[9px] font-mono tracking-wider">PENYEWA</span>
                  <p className="font-semibold text-slate-800">{invoiceBooking.userName}</p>
                  <p className="text-[10px] text-slate-500">{invoiceBooking.userEmail}</p>
                </div>
                <div>
                  <span className="text-slate-450 uppercase text-[9px] font-mono tracking-wider">TANGGAL RESERVASI</span>
                  <p className="font-semibold font-mono text-slate-800">{invoiceBooking.date}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800">Uraian Lapangan & Addon</span>
                  <span className="font-bold text-slate-800">Subtotal</span>
                </div>
                
                <div className="flex justify-between text-slate-650">
                  <span>{invoiceBooking.courtName} ({invoiceBooking.duration} Jam)</span>
                  <span className="font-mono text-slate-800 font-semibold">Rp {invoiceBooking.totalCost - invoiceBooking.equipmentRental.reduce((sum, e)=>sum+(e.price*e.quantity), 0).toLocaleString()}</span>
                </div>

                {invoiceBooking.equipmentRental.length > 0 && (
                  <div className="space-y-1 pt-1.5 border-t border-slate-200/65">
                    <span className="text-[11px] text-slate-500 font-bold block">Peralatan Dipinjam:</span>
                    {invoiceBooking.equipmentRental.map((eq, i) => (
                      <div key={i} className="flex justify-between text-[11px] text-slate-550 pl-2">
                        <span>• {eq.name} (x{eq.quantity})</span>
                        <span className="font-mono">Rp {(eq.price * eq.quantity).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-slate-200 pt-3 flex flex-col gap-1.5 font-bold text-xs">
                  <div className="flex justify-between text-slate-800 text-sm">
                    <span>Total Tagihan:</span>
                    <span className="font-mono text-indigo-700">Rp {invoiceBooking.totalCost.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 text-xs">
                    <span>DP Lunas ({invoiceBooking.paymentMethod.toUpperCase()}):</span>
                    <span className="font-mono">Rp {invoiceBooking.dpPaid.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11.5px] border-t border-dashed border-slate-200/80 pt-2.5">
                    <span>Sisa tagihan di lokasi:</span>
                    <span className="font-mono text-slate-800">Rp {(invoiceBooking.totalCost - invoiceBooking.dpPaid).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1 border-t border-dashed border-slate-200 pt-6">
                <div className="h-10 bg-slate-100 flex items-center justify-between pl-4 pr-4 border border-slate-200 w-full rounded-xl">
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-widest font-bold">SIP-TKT-{invoiceBooking.id.substring(8, 14).toUpperCase()}</span>
                  <div className="flex items-center gap-0.5">
                    {[1,3,4,1,2,5,1,1,3,2,1,4,2,3,4,1,2,5,1,1].map((h, i) => (
                      <div key={i} className="bg-slate-900 w-0.5" style={{ height: `${h * 4}px` }} />
                    ))}
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 mt-1 leading-normal text-center">
                  *Tunjukkan tiket invoice digital ini kepada petugas di lokasi GOR The L3VEL saat bermain.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> PRINT TICKET
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  TUTUP INVOICE
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 6. User Booking History Log List */}
      <div className="mt-16 border-t border-slate-200 pt-10" id="histori-sewa-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 font-display">
              <FileText className="w-5 h-5 text-indigo-600" />
              Histori Transaksi GOR Anda
            </h3>
            <p className="text-slate-500 text-xs mt-1">Gunakan tombol 'Invoice' untuk mencetak bukti sewa</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {currentUser && (
              <div className="flex gap-1.5 p-1 bg-white border border-slate-200 rounded-xl text-xs font-medium">
                <button
                  onClick={() => setHistoryFilter('all')}
                  className={`px-3 py-1 cursor-pointer rounded-lg ${historyFilter === 'all' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Semua ({totalBookingsCount})
                </button>
                <button
                  onClick={() => setHistoryFilter('pending')}
                  className={`px-3 py-1 cursor-pointer rounded-lg ${historyFilter === 'pending' ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Pending ({pendingBookingsCount})
                </button>
                <button
                  onClick={() => setHistoryFilter('approved')}
                  className={`px-3 py-1 cursor-pointer rounded-lg ${historyFilter === 'approved' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  Disetujui ({approvedBookingsCount})
                </button>
              </div>
            )}

            {currentUser && (
              <button
                onClick={fetchUserHistory}
                className="text-xs px-3.5 py-2 cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition font-bold"
              >
                Segarkan Data
              </button>
            )}
          </div>
        </div>

        {currentUser ? (
          loadingHistory ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-slate-200">
              <div className="w-6 h-6 border-2 border-indigo-505 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 animate-pulse">Menghubungkan ke API GOR, harap tunggu...</p>
            </div>
          ) : filteredBookingHistory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="history-cards-container">
              {filteredBookingHistory.map((b) => (
                <div 
                  key={b.id} 
                  className="bg-white rounded-2xl border border-slate-200/95 overflow-hidden flex flex-col justify-between shadow-xs hover:border-slate-350 transition duration-150 p-5 sm:p-6"
                >
                  <div className="space-y-4">
                    {/* Header bar card */}
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 block tracking-wide">ID BOOKING</span>
                        <span className="text-xs font-mono font-bold text-slate-800 select-all">{b.id}</span>
                      </div>
                      <div>{getStatusBadge(b.status)}</div>
                    </div>

                    {/* Details content of card */}
                    <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-semibold">LAPANGAN GOR</span>
                        <span className="text-slate-850 font-bold mt-0.5 block">{b.courtName}</span>
                      </div>
                      
                      <div>
                        <span className="text-slate-400 text-[10px] block font-semibold">TANGGAL RESERVASI</span>
                        <span className="text-slate-800 font-mono font-medium mt-0.5 block">{b.date}</span>
                      </div>

                      <div className="col-span-2">
                        <span className="text-slate-400 text-[10px] block font-semibold">DURASI & JAM</span>
                        <span className="text-slate-850 font-mono font-medium mt-0.5 block">
                          [{b.timeSlots.map(s => `${String(s).padStart(2,'0')}:00`).join(', ')}] ({b.duration} Jam)
                        </span>
                      </div>

                      {b.equipmentRental.length > 0 && (
                        <div className="col-span-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                          <span className="text-[10px] text-slate-450 uppercase font-bold tracking-wider block">Peralatan Dipinjam:</span>
                          <div className="space-y-0.5 mt-1">
                            {b.equipmentRental.map((eq, i) => (
                              <p key={i} className="text-[11px] text-slate-600">• {eq.name} (x{eq.quantity})</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions footer for the ticket */}
                  <div className="border-t border-slate-100 mt-5 pt-4 flex items-center justify-between gap-4">
                    <div className="text-left">
                      <span className="text-[9px] text-slate-400 uppercase block font-semibold">Biaya Lunas DP</span>
                      <span className="font-mono text-xs font-bold text-indigo-700">Rp {b.dpPaid.toLocaleString('id-ID')}</span>
                      <span className="text-[10px] text-slate-500 font-semibold block">Total: Rp {b.totalCost.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => displayInvoice(b)}
                        className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                        title="Unduh / Cetak Bukti"
                      >
                        <Printer className="w-3.5 h-3.5" /> Invoice
                      </button>

                      {b.status === 'pending_confirmation' && (
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="px-3 py-2 bg-red-50 hover:bg-red-100 hover:border-red-200 text-red-650 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Batalkan Booking"
                        >
                          <X className="w-3.5 h-3.5" /> Batalkan
                        </button>
                      )}

                      {b.status === 'approved' && !b.fullPaymentProof && (
                        <button
                          onClick={() => {
                            setSelectedBookingForFullPayment(b);
                            setShowFullPaymentModal(true);
                          }}
                          className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                          title="Upload Pelunasan"
                        >
                          <UploadCloud className="w-3.5 h-3.5" /> Pelunasan
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-200">
              <p className="text-xs text-slate-500">Belum ada penyewaan lapangan terdaftar dengan filter ini.</p>
              <p className="text-[10px] text-slate-405 mt-1">Pilih salah satu lapangan di atas untuk mulai membuat reservasi gratis.</p>
            </div>
          )
        ) : (
          <div className="p-10 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
            <Users className="w-6 h-6 text-slate-350 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-800">Harap Login untuk Memantau Histori Lapangan Anda</h4>
            <p className="text-[11px] text-slate-550 mt-1 max-w-sm mx-auto leading-relaxed">
              Anda saat ini sedang menjelajah dalam Mode Tamu (Guest Mode). Semua reservasi tetap diproses, namun login diperlukan untuk mencetak struk tiket invoice.
            </p>
            <button
              onClick={onOpenAuth}
              className="mt-4 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              Sign-In / Daftar Akun Baru
            </button>
          </div>
        )}
      </div>

      {showProfileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-lg">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">Edit Profil & Data Pribadi</h3>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">Kelola data login, password, dan PIN pengaman Anda.</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama Lengkap</label>
                <input type="text" value={fullNameEdit} onChange={e => setFullNameEdit(e.target.value)} placeholder="Nama Lengkap" className="w-full p-2 border rounded text-xs text-slate-800 bg-white" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Email</label>
                <input type="email" value={emailEdit} onChange={e => setEmailEdit(e.target.value)} placeholder="Email" className="w-full p-2 border rounded text-xs text-slate-800 bg-white" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Nomor Telepon</label>
                <input type="text" value={phoneEdit} onChange={e => setPhoneEdit(e.target.value)} placeholder="Nomor Telepon" className="w-full p-2 border rounded text-xs text-slate-800 bg-white" required />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Password Baru (Untuk Login)</label>
                <input type="text" value={passwordEdit} onChange={e => setPasswordEdit(e.target.value)} placeholder="Password Baru" className="w-full p-2 border rounded text-xs font-mono text-slate-800 bg-white" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowProfileModal(false)} className="flex-1 py-2 border rounded text-xs font-bold text-slate-850">Batal</button>
              <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white rounded text-xs font-bold">Simpan</button>
            </div>
          </form>
        </div>
      )}

      {showFullPaymentModal && selectedBookingForFullPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-lg">
            <div>
              <h3 className="text-lg font-bold text-slate-900 font-display">Proses Pelunasan</h3>
              <p className="text-[10px] text-slate-500 font-sans mt-0.5">Sisa tagihan yang harus dilunasi: Rp {(selectedBookingForFullPayment.totalCost - selectedBookingForFullPayment.dpPaid).toLocaleString('id-ID')}</p>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1">Metode Pelunasan</label>
              <select 
                value={fullPaymentMethod} 
                onChange={(e) => setFullPaymentMethod(e.target.value as 'transfer'|'tunai')}
                className="w-full p-2 border rounded text-xs bg-slate-50"
              >
                <option value="transfer">Bank Transfer / QRIS (Upload Bukti)</option>
                <option value="tunai">Tunai di Kasir</option>
              </select>
            </div>

            {fullPaymentMethod === 'transfer' ? (
              <div className="space-y-4 mt-4">
                 <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition overflow-hidden">
                 <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
                   {uploadingFullPayment ? (
                     <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
                   ) : (
                     <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                   )}
                   <p className="text-xs font-semibold">{uploadingFullPayment ? 'Sedang Mengunggah...' : 'Pilih Gambar Bukti Pelunasan'}</p>
                 </div>
                 <input 
                   type="file" 
                   accept="image/*"
                   className="hidden"
                   onChange={async (e) => {
                     if (!e.target.files || e.target.files.length === 0) return;
                     setUploadingFullPayment(true);
                     const formData = new FormData();
                     formData.append('file', e.target.files[0]);
                     try {
                       const res = await fetch('/api/upload', { method: 'POST', body: formData });
                       const data = await res.json();
                       if (!res.ok) throw new Error(data.error);
                       
                       // After upload success, update the booking with the full payment proof
                       const updateRes = await fetch(`/api/bookings/${selectedBookingForFullPayment.id}/full-payment`, {
                         method: 'PUT',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({ fullPaymentProof: data.url })
                       });
                       const updateData = await updateRes.json();
                       if (!updateRes.ok) throw new Error(updateData.error);
                       
                       showToast('Berhasil', 'Gambar Pelunasan Berhasil Diunggah. Silakan tunggu konfirmasi admin.', 'success');
                       setShowFullPaymentModal(false);
                       setSelectedBookingForFullPayment(null);
                       fetchUserHistory();
                     } catch (err: any) {
                       showToast('Gagal', err.message || 'Gagal mengunggah bukti', 'error');
                     } finally {
                       setUploadingFullPayment(false);
                     }
                   }}
                 />
               </label>
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
                    Anda dapat langsung membayarkan sisa tagihan secara Tunai / Cash di Kasir GOR pada hari-H.
                  </p>
                  <p className="text-[10px] text-amber-600 mt-1">
                    Silakan klik konfirmasi agar Admin mengetahui metode pelunasan Anda.
                  </p>
                </div>
                <button 
                  onClick={handleConfirmTunai}
                  disabled={uploadingFullPayment}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {uploadingFullPayment ? 'Memproses...' : 'Konfirmasi Bayar di Kasir'}
                </button>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowFullPaymentModal(false)} className="w-full py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition">Batal</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
