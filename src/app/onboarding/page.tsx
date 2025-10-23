'use client'

// import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Send, Sparkles, User, Bot } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import { useAuth } from '@/hooks/use-auth'
import { useCreateProfile } from '@/hooks/use-profile'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'assistant' | 'user'
  content: string
}

interface UserProfile {
  name?: string
  age?: number
  gender?: string
  marital_status?: string
  job?: string
  location?: string
  investment_level?: string
  financial_type?: string
}

export default function Onboarding() {
  // const navigate = useNavigate()
  const router = useRouter()
  const { user } = useAuth()
  const createProfileMutation = useCreateProfile()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Halo! Saya AI assistant Zentio 👋 Saya akan membantu Anda setup profil keuangan. Pertama, boleh saya tahu nama Anda?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile>({})
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const questions = [
    { key: 'name', prompt: 'Boleh saya tahu nama Anda?' },
    { key: 'age', prompt: 'Berapa umur Anda?', type: 'number' },
    { key: 'gender', prompt: 'Jenis kelamin Anda? (Pria/Wanita/Lainnya)' },
    {
      key: 'marital_status',
      prompt: 'Status pernikahan Anda? (Lajang/Menikah/Lainnya)',
    },
    { key: 'job', prompt: 'Apa pekerjaan Anda saat ini?' },
    { key: 'location', prompt: 'Di kota mana Anda tinggal?' },
    {
      key: 'investment_level',
      prompt:
        'Bagaimana pengalaman Anda dengan investasi? (Pemula/Menengah/Berpengalaman)',
    },
    {
      key: 'financial_type',
      prompt:
        'Bagaimana gaya keuangan Anda? (Hemat/Moderat/Agresif dalam pengeluaran)',
    },
  ]

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])

    try {
      if (!user) {
        toast.error('Sesi login tidak valid')
        // navigate({ to: '/' })
        router.push('/')
        return
      }

      // Save the answer to profile
      const currentQ = questions[currentQuestion]
      const updatedProfile = {
        ...userProfile,
        [currentQ.key]:
          currentQ.type === 'number' ? parseInt(userMessage) : userMessage,
      }
      setUserProfile(updatedProfile)

      // Move to next question or save
      if (currentQuestion < questions.length - 1) {
        const nextQuestion = currentQuestion + 1
        setCurrentQuestion(nextQuestion)
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: questions[nextQuestion].prompt },
        ])
        setLoading(false)
      } else {
        // All questions answered, save to database using mutation
        createProfileMutation.mutate(
          {
            userId: user.id,
            profile: updatedProfile
          },
          {
            onSuccess: () => {
              // Show completion message
              setMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content:
                    '🎉 Terima kasih! Profil Anda sudah lengkap. Mengarahkan ke dashboard...',
                },
              ])

              setTimeout(() => {
                // navigate({ to: '/app' })
                router.push('/app')
              }, 2000)
            },
            onError: (error) => {
              console.error('Error saving profile:', error)
              toast.error('Gagal menyimpan profil. Silakan coba lagi.')
              setLoading(false)
            }
          }
        )
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan')
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <AppLayout hideLayout>
      <div className="max-w-3xl mx-auto pt-8 pb-24">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI Onboarding
          </div>
          <h1 className="text-3xl font-bold mb-2">Mari Kenalan!</h1>
          <p className="text-gray-600">
            Jawab beberapa pertanyaan untuk personalisasi pengalaman Anda
          </p>
          <div className="mt-4">
            <div className="flex justify-center gap-2">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-8 rounded-full transition-colors ${
                    index <= currentQuestion
                      ? 'bg-emerald-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-emerald-600" />
                    </div>
                  )}
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === 'user'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-gray-100">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ketik jawaban Anda..."
              disabled={loading}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
