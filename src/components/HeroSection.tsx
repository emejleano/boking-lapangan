/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dumbbell, Clock, CreditCard, Sparkles, Trophy } from 'lucide-react';

interface HeroSectionProps {
  onStartBooking: () => void;
}

export default function HeroSection({ onStartBooking }: HeroSectionProps) {
  return (
    <div className="relative bg-slate-50 overflow-hidden border-b border-slate-200 py-16 sm:py-24" id="hero-banner">
      {/* Decorative subtle abstract elements */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-100 rounded-full filter blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-slate-200 rounded-full filter blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-center">
          
          {/* Hero Left Content */}
          <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-7 lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-150 rounded-full text-indigo-700 text-xs font-semibold mb-6 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Satu Aplikasi Sewa Lapangan Terintegrasi
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-none font-display">
              SIPLAKRA <span className="text-indigo-600">L3VEL GOR</span>
            </h1>
            
            <p className="mt-4 text-base sm:text-lg text-slate-600 font-sans max-w-xl">
              Platform modern pemesanan lapangan olahraga digital di GOR The L3VEL. Booking instan untuk <strong>Futsal</strong>, <strong>Basket</strong>, <strong>Badminton</strong>, dan <strong>Padel</strong> lengkap dengan peralatan olahraga premium. Sederhana, aman, dan tanpa perlu mengantri!
            </p>

            <div className="mt-8 flex flex-wrap gap-4 sm:justify-center lg:justify-start">
              <button
                onClick={onStartBooking}
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all transform hover:-translate-y-0.5"
              >
                Booking Lapangan Sekarang
              </button>
              <a
                href="#katalog-lapangan"
                className="px-6 py-3.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium rounded-xl transition shadow-xs"
              >
                Lihat Katalog Lapangan
              </a>
            </div>

            {/* Feature Badges */}
            <div className="mt-12 grid grid-cols-3 gap-4 border-t border-slate-200 pt-8" id="hero-badges">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-900 tracking-tight font-display">4+ Cabor</span>
                <span className="text-xs text-slate-500 mt-1">Futsal, Basket, Bulutangkis, Padel</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-indigo-600 tracking-tight font-display">5 Menit</span>
                <span className="text-xs text-slate-500 mt-1">Konfirmasi Pembayaran Instan</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-slate-800 tracking-tight font-display">100% Real</span>
                <span className="text-xs text-slate-500 mt-1">Lantai Karpet & Pelayanan Maksimal</span>
              </div>
            </div>
          </div>

          {/* Hero Right Visual Column - Beautiful Modern GOR Card */}
          <div className="mt-12 sm:mt-16 lg:mt-0 lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-md transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full filter blur-2xl pointer-events-none" />
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    SIPLAKRA CARD
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-2 font-display">GOR THE L3VEL</h3>
                </div>
                <Trophy className="w-8 h-8 text-indigo-600" />
              </div>

              {/* Minimalist Court Slider Visual */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-200 transition flex items-center gap-4">
                  <span className="p-3 bg-red-100 rounded-xl text-red-650 font-bold text-xs shrink-0">FTSL</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Futsal Interlock Standard</h4>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">Sewa mulai dari Rp150K/Jam</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-200 transition flex items-center gap-4">
                  <span className="p-3 bg-cyan-100 rounded-xl text-cyan-700 font-bold text-xs shrink-0">PADL</span>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="text-xs font-bold text-slate-800 font-display">Padel Tennis Panoramic</h4>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">POPULER</span>
                    </div>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">Sewa mulai dari Rp250K/Jam</p>
                  </div>
                </div>

                {/* Info Pills */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="p-2 bg-slate-100/50 rounded-xl text-center border border-slate-200/60">
                    <Clock className="w-4 h-4 mx-auto text-amber-600 mb-1" />
                    <span className="text-[9px] text-slate-600 font-semibold block">Buka 07:00-23:00</span>
                  </div>
                  <div className="p-2 bg-slate-100/50 rounded-xl text-center border border-slate-200/60">
                    <Dumbbell className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                    <span className="text-[9px] text-slate-600 font-semibold block">Sewa Alat Lengkap</span>
                  </div>
                  <div className="p-2 bg-slate-100/50 rounded-xl text-center border border-slate-200/60">
                    <CreditCard className="w-4 h-4 mx-auto text-indigo-600 mb-1" />
                    <span className="text-[9px] text-slate-600 font-semibold block">DP / QRIS / TF</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
