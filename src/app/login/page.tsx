'use client'

// import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Sparkles, Mail, CheckCircle2 } from 'lucide-react'
import { useLogin, useSignup } from '@/hooks/use-auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Login() {
  // const navigate = useNavigate()
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showEmailSent, setShowEmailSent] = useState(false)

  const loginMutation = useLogin()
  const signupMutation = useSignup()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isLogin && password !== confirmPassword) {
      toast.error('Password tidak cocok!')
      return
    }

    try {
      if (isLogin) {
        // Login
        const result = await loginMutation.mutateAsync({ email, password })

        toast.success('Login berhasil!')
        
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('user_profile')
          .select('*')
          .eq('user_id', result.user.id)
          .single()

        if (!profile) {
          router

          router.push('/onboarding')
        } else {
          router.push('/app')
        }
      } else {
        // Sign up
        const result = await signupMutation.mutateAsync({ email, password })

        if (result.user) {
          // Show email verification message instead of navigating
          setShowEmailSent(true)
          toast.success('Akun berhasil dibuat! Silakan cek email untuk verifikasi.')
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan')
    }
  }

  const loading = loginMutation.isPending || signupMutation.isPending

  // Email sent success view
  if (showEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent a verification link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-emerald-800">
                  <p className="font-medium mb-1">Email Sent Successfully!</p>
                  <p className="text-emerald-700">
                    Click the verification link in your email to activate your account.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p className="font-medium">Next Steps:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Open your email inbox</li>
                <li>Look for email from Zentio</li>
                <li>Click the verification link</li>
                <li>You'll be redirected to the app</li>
              </ol>
            </div>

            <div className="pt-4 border-t space-y-2">
              <p className="text-xs text-gray-500 text-center">
                Didn't receive the email? Check your spam folder.
              </p>
              <Button
                onClick={() => setShowEmailSent(false)}
                variant="outline"
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-200">
              <img src="/logo.svg" alt="Zentio" className="w-16 h-16" />
            </div>
          </div>
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

              <Link href="/" className="block mt-4">
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
