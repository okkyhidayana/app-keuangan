'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2, TrendingUp, Key } from 'lucide-react';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
       return setError('Kata sandi tidak cocok.');
    }
    if (password.length < 6) {
       return setError('Kata sandi minimal 6 karakter.');
    }

    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setMessage('Kata sandi berhasil diubah! Anda akan dialihkan ke dashboard...');
      setTimeout(() => {
         router.push('/dashboard');
      }, 2000);
    }
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
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">Sandi Baru <br/>Telah Siap</h1>
          <p className="text-white/70 text-lg leading-relaxed">Silakan masukkan kombinasi kata sandi baru Anda untuk kembali aman.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
           <div className="mb-8">
             <h2 className="text-2xl font-bold text-foreground">Buat Sandi Baru</h2>
             <p className="text-muted-foreground text-sm mt-1">Isi kolom di bawah untuk memperbarui sandi akun Anda.</p>
           </div>

           <form onSubmit={handleUpdatePassword} className="space-y-4">
             {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">{error}</div>}
             {message ? (
               <div className="bg-emerald-50 text-emerald-700 p-6 rounded-xl text-sm font-medium border border-emerald-200 text-center">
                  {message}
               </div>
             ) : (
               <>
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-1.5">Sandi Baru</label>
                   <div className="relative">
                      <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
                   </div>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-foreground mb-1.5">Konfirmasi Sandi Baru</label>
                   <div className="relative">
                      <Key className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
                   </div>
                 </div>

                 <button type="submit" disabled={loading || !password} className="w-full flex justify-center items-center gap-2 mt-2 py-2.5 px-4 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Sandi Baru'}
                 </button>
               </>
             )}
           </form>
        </div>
      </div>
    </div>
  );
}
