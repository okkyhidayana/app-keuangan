import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const type = searchParams.get('type');

  if (code) {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      if (type === 'recovery') {
         // Jika user klik link "Forgot Password" dari email, arahkan ke halaman Ganti Password
         return NextResponse.redirect(`${origin}/reset-password`);
      }
      
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Jika gagal atau expired
  return NextResponse.redirect(`${origin}/login?error=Link+telah+kedaluwarsa+atau+tidak+valid`);
}
