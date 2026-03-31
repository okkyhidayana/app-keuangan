'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Loader2, ArrowLeft, Send, Shield, BarChart3, TrendingUp, Key } from 'lucide-react';

export default function LupaPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setMessage('Tautan reset password telah dikirim ke email Anda. Periksa kotak masuk atau spam.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-white text-xl font-bold">Keuangan</span>
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">Akses Kembali <br/>Akun Anda</h1>
          <p className="text-white/70 text-lg leading-relaxed">Jangan khawatir, kami akan membantu mereset kata sandi Anda dengan aman.</p>
        </div>
        <div className="relative z-10 grid grid-cols-1 gap-4">
           {/* Decorative */}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
           <div className="mb-8">
             <h2 className="text-2xl font-bold text-foreground">Lupa Password?</h2>
             <p className="text-muted-foreground text-sm mt-1">Masukkan email Anda untuk menerima tautan reset kata sandi.</p>
           </div>

           <form onSubmit={handleResetPassword} className="space-y-5">
             {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">{error}</div>}
             {message ? (
               <div className="bg-emerald-50 text-emerald-700 p-6 rounded-xl text-sm font-medium border border-emerald-200 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-2">
                    <Send className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p>{message}</p>
               </div>
             ) : (
               <>
                 <div>
                   <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">Alamat Email</label>
                   <input
                     id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                     className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                     placeholder="nama@email.com" disabled={loading}
                   />
                 </div>
                 <button type="submit" disabled={loading || !email} className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirim Tautan Reset'}
                 </button>
               </>
             )}
           </form>

           <div className="mt-8 text-center text-sm">
             <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700 hover:underline flex items-center justify-center gap-2">
               <ArrowLeft className="w-4 h-4" /> Kembali ke Login
             </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
