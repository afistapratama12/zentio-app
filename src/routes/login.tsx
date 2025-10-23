import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '~/lib/supabase'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Sparkles } from 'lucide-react'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLogin && password !== confirmPassword) {
      toast.error('Password tidak cocok!')
      return
    }

    setLoading(true)

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        toast.success('Login berhasil!')
        
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('user_profile')
          .select('*')
          .eq('user_id', data.user.id)
          .single()

        if (!profile) {
          // Redirect to onboarding
          navigate({ to: '/onboarding' })
        } else {
          // Redirect to app
          navigate({ to: '/app' })
        }
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        if (data.user) {
          toast.success('Akun berhasil dibuat! Silakan cek email untuk verifikasi.')
          // Auto login after signup
          navigate({ to: '/onboarding' })
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Zentio AI Budgeting
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {isLogin ? 'Selamat Datang Kembali' : 'Mulai Perjalanan Anda'}
          </h1>
          <p className="text-gray-600">
            {isLogin
              ? 'Masuk ke akun Zentio Anda'
              : 'Buat akun untuk memulai budgeting cerdas'}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isLogin ? 'Login' : 'Sign Up'}</CardTitle>
            <CardDescription>
              {isLogin
                ? 'Masukkan email dan password Anda'
                : 'Buat akun baru dengan email dan password'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                />
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? 'Login' : 'Buat Akun'}
              </Button>

              <div className="text-center text-sm">
                <span className="text-gray-600">
                  {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
                </span>{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setConfirmPassword('')
                  }}
                  className="text-emerald-600 hover:text-emerald-700 font-medium"
                  disabled={loading}
                >
                  {isLogin ? 'Sign Up' : 'Login'}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">atau</span>
                </div>
              </div>

              <Link to="/" className="block mt-4">
                <Button variant="outline" className="w-full">
                  Kembali ke Homepage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          Dengan mendaftar, Anda menyetujui Terms of Service dan Privacy Policy kami
        </p>
      </div>
    </div>
  )
}
