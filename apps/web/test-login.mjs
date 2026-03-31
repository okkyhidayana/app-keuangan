import { createBrowserClient } from '@supabase/ssr'
import fetch from 'node-fetch'
import * as crypto from 'crypto'
if (!globalThis.fetch) globalThis.fetch = fetch
if (!globalThis.crypto) globalThis.crypto = crypto

const supabase = createBrowserClient(
  'https://drwthdmgvmuxcbakzmxw.supabase.co',
  'sb_publishable_z02khIa8LPCng9xikBON-A_JYA6PJrs'
)
const res = await supabase.auth.signInWithPassword({
  email: 'infocyber001@gmail.com',
  password: 'kosongaja'
})
console.log("Logged in? ", res.data?.user ? "YES" : res.error?.message)

const session = res.data?.session
if (session) {
  // Try sending a request to /dashboard with the cookie
  const cookieStr = `sb-drwthdmgvmuxcbakzmxw-auth-token=${encodeURIComponent(JSON.stringify(session))}`
  console.log("Cookie string:", cookieStr.substring(0, 100) + '...')
  const hit = await fetch('http://localhost:3002/dashboard', {
    headers: {
      'Cookie': cookieStr,
      'Accept': 'text/html'
    },
    redirect: 'manual'
  })
  console.log('Middleware Redirected to:', hit.status, hit.headers.get('location'))
}
