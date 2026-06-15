/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from '../types';
import { ShieldCheck, LogOut, User as UserIcon, Calendar, BookOpen, AlertCircle } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onOpenAuth: (role?: 'customer' | 'admin') => void;
  activeTab: 'landing' | 'booking' | 'admin';
  setActiveTab: (tab: 'landing' | 'booking' | 'admin') => void;
}

export default function Navbar({
  currentUser,
  onLogout,
  onOpenAuth,
  activeTab,
  setActiveTab,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 text-slate-900 shadow-sm border-b border-slate-200 backdrop-blur" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('landing')}>
            <span className="p-2.5 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 font-display">
                SIPLAKRA
              </h1>
              <p className="text-[10px] font-mono tracking-wider text-indigo-650 font-bold uppercase">
                GOR THE L3VEL
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1" id="nav-desktop">
            <button
              onClick={() => setActiveTab('landing')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === 'landing'
                  ? 'bg-slate-100 text-slate-800 border border-slate-200 font-bold'
                  : 'text-slate-650 hover:bg-slate-55 hover:text-slate-900'
              }`}
            >
              Beranda
            </button>

            {currentUser && currentUser.role === 'customer' && (
              <button
                onClick={() => setActiveTab('booking')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'booking'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Dashboard Saya
              </button>
            )}

            {currentUser && currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-red-50 text-red-700 border border-red-100 font-bold'
                    : 'text-red-650 hover:bg-red-50/50'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Panel Admin
              </button>
            )}
          </nav>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800 font-sans">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[10px] font-mono text-indigo-600 self-end px-1.5 py-0.5 bg-indigo-50 rounded border border-indigo-100 uppercase">
                    {currentUser.role}
                  </span>
                </div>
                <div className="p-2 bg-slate-100 rounded-lg border border-slate-200">
                  <UserIcon className="w-4 h-4 text-slate-600" />
                </div>
                <button
                  onClick={onLogout}
                  className="px-3 py-2 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-slate-600 text-xs rounded-xl transition-all duration-150 flex items-center gap-1.5"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('customer')}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition shadow-sm cursor-pointer"
                >
                  Login / Daftar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
