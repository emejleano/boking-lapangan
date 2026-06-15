/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types';
import { ShieldCheck, Key, Phone, Mail, User as UserIcon, Lock, AlertCircle, Sparkles } from 'lucide-react';

interface AuthViewProps {
  onAuthSuccess: (user: User) => void;
  onClose: () => void;
  defaultRole?: 'customer' | 'admin';
}

export default function AuthView({
  onAuthSuccess,
  onClose,
  defaultRole = 'customer',
}: AuthViewProps) {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const role = defaultRole;
  
  // Registration Inputs
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister 
      ? { fullName, email, phone, password, role }
      : { email, password };

    if (isRegister && (!fullName || !email || !phone || !password)) {
      setErrorMsg('Harap lengkapi seluruh formulir registrasi');
      setLoading(false);
      return;
    }

    if (!isRegister && (!email || !password)) {
      setErrorMsg('Harap masukkan email dan password');
      setLoading(false);
      return;
    }

    fetch(endpoint, {
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
      .then((data) => {
        onAuthSuccess(data.user);
        onClose();
        setLoading(false);
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setLoading(false);
      });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans" id="auth-modal">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-lg relative flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base font-display">
                {isRegister ? 'Registrasi Akun Baru' : 'Masuk SIPLAKRA'}
              </h3>
              <p className="text-[10px] text-indigo-650 uppercase font-mono tracking-wider">GOR The L3VEL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-850 text-xs px-2.5 py-1 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-5 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-650 rounded-xl border border-red-150 text-xs flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isRegister && (
              <>
                {/* FullName */}
                <div>
                  <label className="block text-slate-700 text-xs font-semibold mb-1">Nama Lengkap:</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Masukkan nama Anda..."
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                    />
                  </div>
                </div>

                {/* Handphone */}
                <div>
                  <label className="block text-slate-705 text-xs font-semibold mb-1">Nomor Handphone:</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      placeholder="Contoh: 081234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-slate-700 text-xs font-semibold mb-1">Akun Email:</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  placeholder="Contoh: name@service.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 font-sans"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-700 text-xs font-semibold mb-1">Password Masuk:</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder="Password rahasia..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white text-slate-800 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500 animate-none font-sans"
                  required
                />
              </div>
            </div>

            {/* Submit & Toggle Action Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-sm transition duration-200 cursor-pointer"
              >
                {loading ? 'Sedang Memproses...' : isRegister ? 'Setujui & Daftar Sekarang' : 'Verifikasi PIN & Masuk'}
              </button>
            </div>

          </form>

          {/* Toggle Login/Sign-up */}
          <div className="text-center text-xs mt-3 border-t border-slate-200 pt-4 font-sans">
            <span className="text-slate-505">
              {isRegister ? 'Sudah memiliki akun?' : 'Belum memiliki akun?'}
            </span>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg('');
              }}
              className="text-indigo-600 hover:text-indigo-700 font-bold ml-1.5 underline cursor-pointer"
            >
              {isRegister ? 'Masuk Sekarang' : 'Daftar Akun Baru'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
