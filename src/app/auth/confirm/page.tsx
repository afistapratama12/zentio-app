'use client'

// import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, XCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function ConfirmEmail() {
  // const navigate = useNavigate()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    handleEmailConfirmation()
  }, [])

  async function handleEmailConfirmation() {
    try {
      // Get the hash from URL (Supabase sends token in URL hash)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const type = hashParams.get('type')

      console.log('Confirmation params:', { accessToken: !!accessToken, type })

      if (!accessToken || type !== 'signup') {
        setStatus('error')
        setMessage('Invalid or missing confirmation token.')
        return
      }

      // Exchange the token for a session
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: hashParams.get('refresh_token') || '',
      })

      if (error) {
        console.error('Session error:', error)
        setStatus('error')
        setMessage(error.message || 'Failed to verify email.')
        return
      }

      if (data.user) {
        console.log('Email verified successfully:', data.user.email)
        setStatus('success')
        setMessage('Email verified successfully! Redirecting to dashboard...')

        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('user_profile')
          .select('*')
          .eq('user_id', data.user.id)
          .single()

        setTimeout(() => {
          if (profile) {
            // User has profile, go to dashboard
            router.push('/app')
          } else {
            // User needs onboarding
            router.push('/onboarding')
          }
        }, 2000)
      } else {
        setStatus('error')
        setMessage('Unable to verify email. Please try again.')
      }
    } catch (error: any) {
      console.error('Confirmation error:', error)
      setStatus('error')
      setMessage(error.message || 'An unexpected error occurred.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
            {status === 'loading' && <Loader2 className="h-8 w-8 text-white animate-spin" />}
            {status === 'success' && <CheckCircle2 className="h-8 w-8 text-white" />}
            {status === 'error' && <XCircle className="h-8 w-8 text-white" />}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Please wait while we verify your email address'}
            {status === 'success' && 'Your email has been successfully verified'}
            {status === 'error' && 'We encountered an issue verifying your email'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="flex items-center justify-center gap-3 py-8">
              <Mail className="h-5 w-5 text-gray-400 animate-pulse" />
              <p className="text-sm text-gray-600">Confirming your email address...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-sm text-emerald-800 text-center">{message}</p>
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Redirecting...</span>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 text-center">{message}</p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  Go to Login
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                If you continue to have issues, please contact support.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
