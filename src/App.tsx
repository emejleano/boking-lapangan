/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Court, User } from './types';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import PenyewaDashboard from './components/PenyewaDashboard';
import AdminDashboard from './components/AdminDashboard';
import AuthView from './components/AuthView';
import { HelpCircle, ShieldCheck, Mail, Phone, Calendar, Info, Search, Filter, ArrowRight, Award, Trophy, Users, Star, StarOff, Sparkles, ChevronRight, Check } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [activeTab, setActiveTab] = useState<'landing' | 'booking' | 'admin'>('landing');
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [pendingCourtSelection, setPendingCourtSelection] = useState<Court | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [defaultAuthRole, setDefaultAuthRole] = useState<'customer' | 'admin'>('customer');
  const [loadingCourts, setLoadingCourts] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'futsal' | 'basket' | 'badminton' | 'padel'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load user from LocalStorage on mount (persistent session)
  useEffect(() => {
    const savedUser = localStorage.getItem('siplakra_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        if (parsed.role === 'admin') {
          setActiveTab('admin');
        } else {
          setActiveTab('booking');
        }
      } catch (e) {
        localStorage.removeItem('siplakra_user');
      }
    }
  }, []);

  // Fetch courts catalog from API
  const fetchCourts = () => {
    setLoadingCourts(true);
    fetch('/api/courts')
      .then((res) => res.json())
      .then((data) => {
        setCourts(data);
        setLoadingCourts(false);
      })
      .catch((err) => {
        console.error('Gagal memuat katalog lapangan dari API:', err);
        setLoadingCourts(false);
      });
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('siplakra_user', JSON.stringify(user));
    
    // Redirect logic
    if (user.role === 'admin') {
      setActiveTab('admin');
    } else {
      if (pendingCourtSelection) {
        setSelectedCourt(pendingCourtSelection);
        setPendingCourtSelection(null);
      }
      setActiveTab('booking');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('siplakra_user');
    setSelectedCourt(null);
    setPendingCourtSelection(null);
    setActiveTab('landing');
  };

  const handleOpenAuth = (role: 'customer' | 'admin' = 'customer') => {
    setDefaultAuthRole(role);
    setShowAuthModal(true);
  };

  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname === '/login/admin';

  if (isAdminRoute && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-900/5 pattern-dots" />
        <div className="relative z-10 w-full max-w-md">
          <AuthView
            defaultRole="admin"
            onAuthSuccess={(user) => {
              handleAuthSuccess(user);
              window.history.pushState({}, '', '/');
            }}
            onClose={() => window.location.href = '/'}
          />
        </div>
      </div>
    );
  }

  // Auto redirect if an admin tries to access /login/admin while already logged in
  if (isAdminRoute && currentUser) {
    window.history.pushState({}, '', '/');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col justify-between" id="siplakra-root">
      
      {/* Dynamic Header Navbar Section */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenAuth={handleOpenAuth}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1">
        {/* LANDING PAGE / VISITOR FLOW */}
        {activeTab === 'landing' && (
          <div className="space-y-16 pb-16">
            {/* Elegant Hero Banner */}
            <HeroSection onStartBooking={() => {
              const element = document.getElementById('landing-catalog');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }} />

            {/* Why Choose Us / Keunggulan GOR Section */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-12">
                <span className="px-3 py-1 bg-indigo-50 border border-indigo-150 rounded-full text-indigo-700 text-[10px] font-bold font-mono uppercase tracking-widest">
                  Fasilitas & Kualitas VIP
                </span>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-3 font-display">
                  Mengapa Memilih GOR <span className="text-indigo-605">The L3VEL</span>?
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm mt-3 leading-relaxed">
                  Kami mengintegrasikan kualitas arena fisik bersertifikasi internasional dengan sistem informasi reservasi modern berbasis web yang instan, transparan, dan bebas calo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition duration-200">
                  <div className="p-3.5 bg-indigo-50 text-indigo-650 rounded-2xl w-fit border border-indigo-100">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-4 font-display">Sewa Instan 24/7</h3>
                  <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                    Eksplorasi jadwal kosong secara langsung. Sistem terpadu kami mencegah crash tabir ganda (double-booking) secara real-time.
                  </p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition duration-200">
                  <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl w-fit border border-emerald-100">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-4 font-display">DP Lunak 50% via QRIS</h3>
                  <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                    Ringankan biaya sewa Anda! Cukup bayar uang muka minimal 50% lewat QRIS otomatis atau transfer bank, amankan arena pilihan Anda.
                  </p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition duration-200">
                  <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl w-fit border border-amber-100">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-4 font-display">Sertifikasi Grade-A</h3>
                  <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                    Lantai karpet interlock VIP untuk futsal & badminton, ring hidrolik basket standar FIBA, serta kaca tebal panoramik untuk olahraga padel.
                  </p>
                </div>

                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs hover:shadow-md transition duration-200">
                  <div className="p-3.5 bg-slate-100 text-slate-700 rounded-2xl w-fit border border-slate-200">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-4 font-display">Sewa Perlengkapan</h3>
                  <p className="text-xs text-slate-500 mt-2.5 leading-relaxed">
                    Tak usah pusing membawa perlengkapan. Kami menyewakan bola futsal, raket Yonex, Adidas padel, rompi tim, hingga sepatu premium.
                  </p>
                </div>
              </div>
            </section>

            {/* Landing Interactive court list */}
            <section id="landing-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 scroll-mt-20">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 border-b border-slate-200 pb-5">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
                    Pilih & Sewa Lapangan Premium
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1">
                    Silakan gunakan penapis kategori olahraga dan pesan jadwal bermain Anda secara mudah.
                  </p>
                </div>

                {/* Search Bar & Category filter UI */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Cari lapangan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 bg-white text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-48 font-medium shadow-xs text-slate-800"
                    />
                  </div>

                  <div className="flex bg-white p-1 rounded-xl border border-slate-200 text-xs" id="landing-categories">
                    {(['all', 'futsal', 'basket', 'badminton', 'padel'] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg font-bold font-sans transition-all text-[11px] capitalize cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {cat === 'all' ? 'Semua' : cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Court list catalog display */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {courts
                  .filter((c) => selectedCategory === 'all' || c.category === selectedCategory)
                  .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((court) => (
                    <div 
                      key={court.id} 
                      className="bg-white border border-slate-200 rounded-3xl overflow-hidden hover:border-indigo-400 transition-all duration-300 flex flex-col justify-between shadow-xs hover:shadow-md"
                    >
                      <div>
                        {/* Display Hero Image */}
                        <div className="relative h-48 overflow-hidden bg-slate-105">
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
                          
                          <div className="absolute bottom-3 right-3 bg-white/95 px-3 py-1.5 rounded-xl text-slate-900 font-mono font-bold text-xs tracking-tight border border-slate-200 shadow-sm">
                            Rp {court.pricePerHour.toLocaleString('id-ID')} <span className="text-[10px] font-normal text-slate-500">/ jam</span>
                          </div>
                        </div>

                        {/* Text descriptions */}
                        <div className="p-5">
                          <h3 className="text-base sm:text-lg font-extrabold text-slate-900 font-display">{court.name}</h3>
                          <p className="text-slate-600 text-xs mt-3 leading-relaxed min-h-[60px] line-clamp-3">
                            {court.description}
                          </p>
                        </div>
                      </div>

                      {/* CTA Buttons */}
                      <div className="p-5 pt-0 mt-auto">
                        {court.status === 'maintenance' ? (
                          <div className="w-full text-center py-3 text-xs font-semibold bg-red-50 text-red-650 rounded-2xl border border-red-150">
                            Sedang Perawatan (Maintenance)
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (!currentUser || currentUser.role === 'customer') {
                                setSelectedCourt(court);
                                setActiveTab('booking');
                                setTimeout(() => {
                                  document.getElementById('form-booking-section')?.scrollIntoView({ behavior: 'smooth' });
                                }, 150);
                              } else if (currentUser && currentUser.role === 'admin') {
                                alert('Akun admin tidak diperkenankan memesan lapangan. Silakan gunakan akun customer biasa.');
                              }
                            }}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-2xl transition duration-150 shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            📅 Booking Jadwal & Alat
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </section>
            
            {/* Real Testimonials / Interactive FAQ Section */}
            <section className="bg-white border-y border-slate-200 py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                  <div>
                    <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md font-bold font-mono tracking-widest uppercase">
                      Testimoni Penyewa
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight mt-3">
                      Apa Kata Pelanggan Setia GOR L3VEL?
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mt-4">
                      SIPLAKRA membantu ratusan klub futsal, basket, badminton, dan padel mengamankan waktu latihan mingguan mereka tanpa repot antre manual atau ditipu calo pembayaran.
                    </p>
                    
                    <div className="mt-6 flex items-center gap-1 text-amber-500">
                      {[1,2,3,4,5].map(n => <Star key={n} className="w-5 h-5 fill-current" />)}
                      <span className="text-slate-700 font-bold text-xs ml-2">4.9 / 5.0 (2,400+ ulasan)</span>
                    </div>
                  </div>

                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-55 border border-slate-205 rounded-3xl">
                      <p className="text-xs text-slate-600 italic leading-relaxed">
                        "Biasanya booking lewat WhatsApp admin GOR suka slow-response dan sering tabrakan jadwal. Sekarang pakai SIPLAKRA tinggal klik slot, bayar DP, langsung keluar boarding pass digitalnya. Sangat canggih!"
                      </p>
                      <div className="flex items-center gap-3 mt-4">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center font-mono">
                          HN
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 font-sans">Hendrawan Nugroho</h4>
                          <span className="text-[10px] text-slate-450 block font-sans">Kapten FCD Cilegon</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-55 border border-slate-205 rounded-3xl">
                      <p className="text-xs text-slate-600 italic leading-relaxed">
                        "Lapangan Padel Panoramic kaca di sini adalah yang terbaik di kelasnya. Kami bisa sewa langsung bola dan raket premium lewat sistem SIPLAKRA, jadi tinggal datang bawa badan dan sehat. Verifikasinya sangat cepat."
                      </p>
                      <div className="flex items-center gap-3 mt-4">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center font-mono">
                          SF
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 font-sans">Siti Fauziah</h4>
                          <span className="text-[10px] text-slate-450 block font-sans">Padel Hobbyist</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* CUSTOMER BOOKING ZONE / PRIVATE RESERVATION MANAGER */}
        {activeTab === 'booking' && (!currentUser || currentUser?.role === 'customer') && (
          <div className="bg-slate-50">
            {loadingCourts ? (
              <div className="p-16 text-center">
                <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-xs text-slate-500">Mengkoneksikan ke database ketersediaan GOR...</p>
              </div>
            ) : (
              <PenyewaDashboard
                currentUser={currentUser}
                courts={courts}
                selectedCourt={selectedCourt}
                setSelectedCourt={setSelectedCourt}
                onOpenAuth={() => handleOpenAuth('customer')}
              />
            )}
          </div>
        )}

        {/* ADMIN CONTROL PANEL / BACKOFFICE MANAGEMENT PANEL */}
        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <div className="bg-slate-50/50">
            <AdminDashboard
              courts={courts}
              onRefreshCourts={fetchCourts}
            />
          </div>
        )}
      </main>

      {/* Auth Login/Registration Dialog Modal Overlay */}
      {showAuthModal && (
        <AuthView
          onAuthSuccess={handleAuthSuccess}
          onClose={() => setShowAuthModal(false)}
          defaultRole={defaultAuthRole}
        />
      )}

      {/* Modular Aesthetic Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12 text-slate-400 text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Column 1: Brand details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-slate-900 text-cyan-400 rounded-lg border border-slate-800">
                  <Calendar className="w-4 h-4" />
                </span>
                <span className="text-base font-bold text-slate-200">SIPLAKRA GOR L3VEL</span>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-xs">
                Sistem informasi reservasi lapangan terintegrasi standar modern, cepat, transparan, dan aman bebas penipuan.
              </p>
            </div>

            {/* Column 2: Location details */}
            <div className="space-y-3">
              <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Hubungi Kami (Lokasi GOR)</h4>
              <p className="leading-relaxed text-slate-400 max-w-xs">
                Jl. Ahmad Yani No. 120, Cilegon - Banten.<br />
                Buka Setiap Hari: 07:00 - 23:00 WIB
              </p>
              <div className="flex items-center gap-1.5 text-slate-350">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>+62 812-3456-7890</span>
              </div>
            </div>

            {/* Column 3: Tech Disclaimer */}
            <div className="space-y-3">
              <h4 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Informasi Sistem Terpadu</h4>
              <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-850 text-[10px] leading-relaxed text-slate-400">
                <p className="font-semibold text-slate-300 flex items-center gap-1 mb-1">
                  <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  PIECES Compliant Solution
                </p>
                Aplikasi ini dirancang untuk mengatasi antrean manual, mempercepat muat ulang ketersediaan jadwal lapangan, menambah opsi pembayaran e-wallet/transfer bank, serta melampirkan fitur double-booking engine.
              </div>
            </div>

          </div>

          <div className="mt-8 border-t border-slate-900 pt-6 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>&copy; 2026 SIPLAKRA GOR The L3VEL. Hak Cipta dilindungi Undang-Undang.</span>
            <span className="font-mono text-cyan-500 font-bold">TERPADU • HANDAL • PRAKTIS</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
